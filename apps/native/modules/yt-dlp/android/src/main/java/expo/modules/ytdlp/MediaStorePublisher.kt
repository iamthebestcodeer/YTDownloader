package expo.modules.ytdlp

import android.content.ContentResolver
import android.content.ContentValues
import android.net.Uri
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import java.io.File

/** A file that has been copied into the shared Downloads collection. */
data class PublishedFile(
  val uri: Uri,
  val name: String,
  val mimeType: String,
  val sizeBytes: Long,
)

/**
 * Moves finished downloads from app-private storage into the public
 * `Download/<appFolder>` collection so they are visible to other apps.
 */
class MediaStorePublisher(
  private val contentResolver: ContentResolver,
  private val appFolder: String,
) {
  fun publishDirectory(directory: File): List<PublishedFile> =
    directory.walkTopDown()
      .filter { it.isFile && !it.isTemporaryArtifact() }
      .sortedBy { it.path }
      .map { publish(it, relativeFolderOf(it, directory)) }
      .toList()

  private fun publish(file: File, subFolder: String): PublishedFile {
    val mimeType = mimeTypeOf(file)
    val pendingEntry = ContentValues().apply {
      put(MediaStore.Downloads.DISPLAY_NAME, file.name)
      put(MediaStore.Downloads.MIME_TYPE, mimeType)
      put(MediaStore.Downloads.RELATIVE_PATH, relativePathFor(subFolder))
      put(MediaStore.Downloads.IS_PENDING, 1)
    }
    val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, pendingEntry)
      ?: error("Could not create ${file.name} in Downloads")

    try {
      copyInto(uri, file)
      contentResolver.update(uri, ContentValues().apply { put(MediaStore.Downloads.IS_PENDING, 0) }, null, null)
    } catch (error: Exception) {
      contentResolver.delete(uri, null, null)
      throw error
    }

    return PublishedFile(uri, file.name, mimeType, file.length())
  }

  private fun copyInto(uri: Uri, file: File) {
    val output = contentResolver.openOutputStream(uri) ?: error("Could not write ${file.name}")
    output.use { sink -> file.inputStream().use { source -> source.copyTo(sink) } }
  }

  private fun relativePathFor(subFolder: String): String =
    listOf(DOWNLOADS_ROOT, appFolder, subFolder)
      .filter { it.isNotBlank() }
      .joinToString(separator = "/", postfix = "/")

  private fun relativeFolderOf(file: File, root: File): String =
    file.parentFile?.relativeTo(root)?.path.orEmpty()

  private fun mimeTypeOf(file: File): String =
    MimeTypeMap.getSingleton().getMimeTypeFromExtension(file.extension.lowercase()) ?: FALLBACK_MIME_TYPE

  private fun File.isTemporaryArtifact(): Boolean = extension in TEMPORARY_EXTENSIONS

  private companion object {
    const val DOWNLOADS_ROOT = "Download"
    const val FALLBACK_MIME_TYPE = "application/octet-stream"
    val TEMPORARY_EXTENSIONS = setOf("part", "ytdl", "temp", "tmp")
  }
}
