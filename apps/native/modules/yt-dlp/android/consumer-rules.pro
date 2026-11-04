# youtubedl-android unpacks Python and ffmpeg with commons-compress, whose zip support
# looks classes up by reflection, and maps yt-dlp's JSON with Jackson.
# Minifying either breaks yt-dlp at startup, so keep them intact.
-keep class com.yausername.** { *; }
-keep class org.apache.commons.compress.** { *; }
-keep class com.fasterxml.jackson.** { *; }
-dontwarn org.apache.commons.compress.**
-dontwarn com.fasterxml.jackson.databind.**
