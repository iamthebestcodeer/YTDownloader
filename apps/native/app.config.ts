import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "YTDownloader";
/** Same id as the original Kotlin app so installs upgrade in place. */
const ANDROID_PACKAGE = "com.aistudio.ytdownloader.abx";

/** CI passes the run number so every release has a higher version code than the last. */
const buildNumber = Number(process.env.BUILD_NUMBER ?? "1");
const version = `2.0.${buildNumber}`;

const YOUTUBE_LINK_FILTERS = [
	{
		host: "youtube.com",
		pathPrefixes: ["/watch", "/shorts", "/playlist", "/live"],
	},
	{
		host: "www.youtube.com",
		pathPrefixes: ["/watch", "/shorts", "/playlist", "/live"],
	},
	{
		host: "m.youtube.com",
		pathPrefixes: ["/watch", "/shorts", "/playlist", "/live"],
	},
	{ host: "music.youtube.com", pathPrefixes: ["/watch", "/playlist"] },
	{ host: "youtu.be", pathPrefixes: ["/"] },
];

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: APP_NAME,
	slug: "ytdownloader",
	version,
	orientation: "portrait",
	icon: "./assets/images/icon.png",
	scheme: "ytdownloader",
	userInterfaceStyle: "automatic",
	platforms: ["android", "web"],
	android: {
		package: ANDROID_PACKAGE,
		versionCode: buildNumber,
		adaptiveIcon: {
			backgroundColor: "#E0312B",
			foregroundImage: "./assets/images/android-icon-foreground.png",
			monochromeImage: "./assets/images/android-icon-monochrome.png",
		},
		predictiveBackGestureEnabled: false,
		intentFilters: [
			{
				action: "VIEW",
				category: ["BROWSABLE", "DEFAULT"],
				data: YOUTUBE_LINK_FILTERS.flatMap(({ host, pathPrefixes }) =>
					pathPrefixes.map((pathPrefix) => ({
						scheme: "https",
						host,
						pathPrefix,
					})),
				),
			},
			{
				action: "SEND",
				category: ["DEFAULT"],
				data: [{ mimeType: "text/plain" }],
			},
		],
	},
	web: {
		bundler: "metro",
		output: "single",
		favicon: "./assets/images/favicon.png",
	},
	plugins: [
		"expo-router",
		[
			"expo-splash-screen",
			{
				image: "./assets/images/splash-icon.png",
				imageWidth: 160,
				resizeMode: "contain",
				backgroundColor: "#F7F7F7",
				dark: { backgroundColor: "#0F0F12" },
			},
		],
		"expo-image",
		[
			"expo-build-properties",
			{
				android: {
					// Finished files are published through MediaStore.Downloads, added in Android 10.
					minSdkVersion: 29,
					// The embedded Python and ffmpeg binaries must be extracted to disk to run.
					useLegacyPackaging: true,
				},
			},
		],
		"./plugins/with-release-signing",
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
});
