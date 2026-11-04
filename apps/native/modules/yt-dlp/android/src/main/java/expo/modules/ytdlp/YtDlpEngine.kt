package expo.modules.ytdlp

import android.content.Context
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File

/** Progress reported by yt-dlp for a running download. */
data class DownloadProgress(
  val percent: Float,
  val etaSeconds: Long,
  val line: String,
)

enum class UpdateResult { UPDATED, ALREADY_UP_TO_DATE }

/**
 * Thin, thread-safe wrapper around the embedded yt-dlp binary.
 *
 * Every call that touches yt-dlp is blocking, so they all run on [Dispatchers.IO].
 */
class YtDlpEngine(private val context: Context) {
  private val initLock = Mutex()
  private var isInitialized = false

  suspend fun ensureInitialized() = initLock.withLock {
    if (isInitialized) return@withLock
    withContext(Dispatchers.IO) {
      YoutubeDL.getInstance().init(context)
      FFmpeg.getInstance().init(context)
    }
    isInitialized = true
  }

  suspend fun version(): String? {
    ensureInitialized()
    return YoutubeDL.getInstance().versionName(context)
  }

  suspend fun update(): UpdateResult {
    ensureInitialized()
    val status = withContext(Dispatchers.IO) {
      YoutubeDL.getInstance().updateYoutubeDL(context, YoutubeDL.UpdateChannel._STABLE)
    }
    return if (status == YoutubeDL.UpdateStatus.DONE) UpdateResult.UPDATED else UpdateResult.ALREADY_UP_TO_DATE
  }

  /** Runs yt-dlp with [arguments] and returns its standard output. */
  suspend fun dumpJson(target: String, arguments: List<String>): String {
    ensureInitialized()
    val request = YoutubeDLRequest(target).withArguments(arguments)
    return withContext(Dispatchers.IO) { YoutubeDL.getInstance().execute(request).out }
  }

  suspend fun download(
    processId: String,
    url: String,
    arguments: List<String>,
    outputDirectory: File,
    onProgress: (DownloadProgress) -> Unit,
  ) {
    ensureInitialized()
    outputDirectory.mkdirs()
    val request = YoutubeDLRequest(url)
      .withArguments(arguments)
      .addOption("--paths", outputDirectory.absolutePath)
    withContext(Dispatchers.IO) {
      YoutubeDL.getInstance().execute(request, processId) { percent, etaSeconds, line ->
        onProgress(DownloadProgress(percent, etaSeconds, line))
      }
    }
  }

  fun stop(processId: String): Boolean = YoutubeDL.getInstance().destroyProcessById(processId)

  /**
   * Arguments arrive as a flat command-line list ("--flag", "value", "--switch").
   * They are passed through verbatim, so the JavaScript side owns their meaning.
   * The library appends the URL last; "--" stops yt-dlp from reading it as an option.
   */
  private fun YoutubeDLRequest.withArguments(arguments: List<String>): YoutubeDLRequest =
    apply { addCommands(arguments + END_OF_OPTIONS) }

  private companion object {
    const val END_OF_OPTIONS = "--"
  }
}
