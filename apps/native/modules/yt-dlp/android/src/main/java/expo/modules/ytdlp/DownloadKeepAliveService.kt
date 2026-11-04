package expo.modules.ytdlp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Foreground service that keeps the process alive while downloads run in the background.
 * It does no work itself; it only owns the ongoing "downloading" notification.
 */
class DownloadKeepAliveService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val activeDownloads = intent?.getIntExtra(EXTRA_ACTIVE_DOWNLOADS, 1) ?: 1
    ServiceCompat.startForeground(
      this,
      DownloadNotification.ID,
      DownloadNotification.build(this, activeDownloads),
      ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
    )
    return START_NOT_STICKY
  }

  /** Android 15+ caps dataSync services; stopping when told avoids a crash. */
  override fun onTimeout(startId: Int, fgsType: Int) {
    stopSelf()
  }

  override fun onDestroy() {
    isRunning = false
    super.onDestroy()
  }

  companion object {
    private const val EXTRA_ACTIVE_DOWNLOADS = "activeDownloads"

    /**
     * Downloads finish one by one, and the next queued one starts a moment later. Stopping right
     * away would mean restarting from the background, which Android 12+ forbids, so wait a bit.
     */
    private const val STOP_GRACE_PERIOD_MS = 5_000L

    private val mainThread = Handler(Looper.getMainLooper())

    // Only touched on the main thread.
    private var isRunning = false
    private var pendingStop: Runnable? = null

    /**
     * Mirrors [activeDownloads] in the ongoing notification: starts the service for the first
     * download, refreshes the text while it runs and stops it once nothing is left.
     */
    fun sync(context: Context, activeDownloads: Int) {
      val appContext = context.applicationContext
      mainThread.post { syncOnMainThread(appContext, activeDownloads) }
    }

    private fun syncOnMainThread(context: Context, activeDownloads: Int) {
      pendingStop?.let(mainThread::removeCallbacks)
      pendingStop = null
      val intent = Intent(context, DownloadKeepAliveService::class.java)
      when {
        activeDownloads <= 0 -> if (isRunning) scheduleStop(context, intent)
        isRunning -> DownloadNotification.refresh(context, activeDownloads)
        else -> {
          intent.putExtra(EXTRA_ACTIVE_DOWNLOADS, activeDownloads)
          isRunning = runCatching { ContextCompat.startForegroundService(context, intent) }.isSuccess
        }
      }
    }

    private fun scheduleStop(context: Context, intent: Intent) {
      val stop = Runnable {
        pendingStop = null
        isRunning = false
        context.stopService(intent)
      }
      pendingStop = stop
      mainThread.postDelayed(stop, STOP_GRACE_PERIOD_MS)
    }
  }
}

/** Builds the ongoing notification shown while downloads are running. */
private object DownloadNotification {
  const val ID = 4120
  private const val CHANNEL_ID = "downloads"

  fun build(context: Context, activeDownloads: Int): Notification {
    ensureChannel(context)
    return NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.stat_sys_download)
      .setContentTitle(titleFor(activeDownloads))
      .setContentText("Tap to view progress")
      .setContentIntent(openAppIntent(context))
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setProgress(0, 0, true)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .build()
  }

  fun refresh(context: Context, activeDownloads: Int) {
    notificationManager(context).notify(ID, build(context, activeDownloads))
  }

  private fun titleFor(activeDownloads: Int): String =
    if (activeDownloads == 1) "Downloading 1 item" else "Downloading $activeDownloads items"

  private fun openAppIntent(context: Context): PendingIntent? {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(context, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE)
  }

  private fun ensureChannel(context: Context) {
    val channel = NotificationChannel(CHANNEL_ID, "Downloads", NotificationManager.IMPORTANCE_LOW)
    notificationManager(context).createNotificationChannel(channel)
  }

  private fun notificationManager(context: Context): NotificationManager =
    context.getSystemService(NotificationManager::class.java)
}
