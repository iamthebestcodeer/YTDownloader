const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// with-release-signing";

const SIGNING_CONFIG = `
        ${MARKER}
        release {
            def keystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
            if (keystorePath) {
                storeFile file(keystorePath)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`;

/**
 * Signs release builds with the keystore named by ANDROID_KEYSTORE_PATH (set in CI).
 * Without it, release builds fall back to the debug key so local builds still work.
 */
function withReleaseSigning(config) {
	return withAppBuildGradle(config, (gradleConfig) => {
		const gradle = gradleConfig.modResults.contents;
		if (gradle.includes(MARKER)) return gradleConfig;

		const withConfig = gradle.replace(
			/signingConfigs\s*\{/,
			(match) => `${match}${SIGNING_CONFIG}`,
		);
		const withReleaseType = withConfig.replace(
			/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
			'$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
		);
		if (withReleaseType === withConfig) {
			throw new Error(
				"with-release-signing: could not find the release build type in app/build.gradle",
			);
		}
		gradleConfig.modResults.contents = withReleaseType;
		return gradleConfig;
	});
}

module.exports = withReleaseSigning;
