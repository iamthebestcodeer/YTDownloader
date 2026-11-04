package expo.modules.ytdlp

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.SystemClock
import com.yausername.youtubedl_android.YoutubeDL
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.ConcurrentHashMap

private const val PROGRESS_EVENT = "onProgress"
private const val SHARED_TEXT_EVENT = "onSharedText"
private const val PROGRESS_INTERVAL_MS = 250L
private const val APP_FOLDER = "YTDownloader"

class DownloadCancelledException : CodedException("ERR_DOWNLOAD_CANCELLED", "The download was stopped", null)

class YtDlpModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  private val engine by lazy { YtDlpEngine(context) }
  private val publisher by lazy { MediaStorePublisher(context.contentResolver, APP_FOLDER) }
  private val activeJobs = ConcurrentHashMap.newKeySet<String>()
  private val lastProgressAt = ConcurrentHashMap<String, Long>()

  override fun definition() = ModuleDefinition {
    Name("YtDlp")

    Events(PROGRESS_EVENT, SHARED_TEXT_EVENT)

    AsyncFunction("initialize") Coroutine { -> engine.ensureInitialized() }

    AsyncFunction("getVersion") Coroutine { -> engine.version() }

    AsyncFunction("update") Coroutine { ->
      when (engine.update()) {
        UpdateResult.UPDATED -> "updated"
        UpdateResult.ALREADY_UP_TO_DATE -> "up-to-date"
      }
    }

    AsyncFunction("dumpJson") Coroutine { target: String, arguments: List<String> ->
      engine.dumpJson(target, arguments)
    }

    AsyncFunction("startDownload") Coroutine { jobId: String, url: String, arguments: List<String> ->
      runDownload(jobId, url, arguments)
    }

    Function("stopDownload") { jobId: String -> engine.stop(jobId) }

    Function("discardDownload") { jobId: String -> workingDirectoryOf(jobId).deleteRecursively() }

    Function("openFile") { uri: String, mimeType: String -> openFile(Uri.parse(uri), mimeType) }

    Function("consumeSharedText") { consumeSharedText(appContext.currentActivity?.intent) }

    OnNewIntent { intent ->
      consumeSharedText(intent)?.let { sendEvent(SHARED_TEXT_EVENT, mapOf("text" to it)) }
    }
  }

  private suspend fun runDownload(jobId: String, url: String, arguments: List<String>): List<Map<String, Any>> {
    val workingDirectory = workingDirectoryOf(jobId)
    markActive(jobId)
    try {
      engine.download(jobId, url, arguments, workingDirectory) { progress -> emitProgress(jobId, progress) }
      val files = withContext(Dispatchers.IO) {
        publisher.publishDirectory(workingDirectory).also { workingDirectory.deleteRecursively() }
      }
      return files.map { it.toJs() }
    } catch (error: YoutubeDL.CanceledException) {
      throw DownloadCancelledException()
    } finally {
      markInactive(jobId)
    }
  }

  private fun emitProgress(jobId: String, progress: DownloadProgress) {
    val now = SystemClock.elapsedRealtime()
    val previous = lastProgressAt[jobId] ?: 0L
    if (now - previous < PROGRESS_INTERVAL_MS) return
    lastProgressAt[jobId] = now
    sendEvent(
      PROGRESS_EVENT,
      mapOf(
        "jobId" to jobId,
        "percent" to progress.percent.toDouble(),
        "etaSeconds" to progress.etaSeconds.toDouble(),
        "line" to progress.line,
      ),
    )
  }

  private fun markActive(jobId: String) {
    activeJobs.add(jobId)
    DownloadKeepAliveService.sync(context, activeJobs.size)
  }

  private fun markInactive(jobId: String) {
    activeJobs.remove(jobId)
    lastProgressAt.remove(jobId)
    DownloadKeepAliveService.sync(context, activeJobs.size)
  }

  private fun workingDirectoryOf(jobId: String): File =
    File(context.cacheDir, "downloads/${File(jobId).name}")

  private fun openFile(uri: Uri, mimeType: String) {
    val intent = Intent(Intent.ACTION_VIEW)
      .setDataAndType(uri, mimeType)
      .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(Intent.createChooser(intent, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  /** Reads text shared to the app once, so the same share is not handled twice. */
  private fun consumeSharedText(intent: Intent?): String? {
    if (intent?.action != Intent.ACTION_SEND) return null
    val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return null
    intent.removeExtra(Intent.EXTRA_TEXT)
    return text
  }

  private fun PublishedFile.toJs(): Map<String, Any> = mapOf(
    "uri" to uri.toString(),
    "name" to name,
    "mimeType" to mimeType,
    "sizeBytes" to sizeBytes.toDouble(),
  )
}
