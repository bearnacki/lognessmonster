const APP_NAME = "LogNessMonster";
const APP_DESCRIPTION =
  "Transform raw log data into actionable insights with a powerful log analysis tool. Visualize patterns and detect anomalies in real-time.";
const APP_KEYWORDS = [
  "log",
  "log analysis",
  "log visualization",
  "log monitoring",
  "log insights",
  "anomaly detection",
];
const APP_DOMAIN = "https://lognessmonster.com/";

export const getSEOTags = ({
  title,
  description,
  keywords,
  openGraph,
  canonicalUrlRelative,
  extraTags,
} = {}) => {
  return {
    // up to 50 characters (what does your app do for the user?) > your main should be here
    title: title || APP_NAME,
    // up to 160 characters (how does your app help the user?)
    description: description || APP_DESCRIPTION,
    // some keywords separated by commas. by default it will be your app name
    keywords: keywords || APP_KEYWORDS,
    applicationName: APP_NAME,
    // set a base URL prefix for other fields that require a fully qualified URL (.e.g og:image: og:image: 'https://yourdomain.com/share.png' => '/share.png')
    metadataBase: new URL(
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/"
        : APP_DOMAIN
    ),

    openGraph: {
      title: openGraph?.title || APP_NAME,
      description: openGraph?.description || APP_DESCRIPTION,
      url: openGraph?.url || APP_DOMAIN,
      siteName: openGraph?.title || APP_NAME,
      // If you add an opengraph-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [
      //   {
      //     url: `https://${config.domainName}/share.png`,
      //     width: 1200,
      //     height: 660,
      //   },
      // ],
      locale: "en_US",
      type: "website",
    },

    twitter: {
      title: openGraph?.title || APP_NAME,
      description: openGraph?.description || APP_DESCRIPTION,
      // If you add an twitter-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [openGraph?.image || defaults.og.image],
      card: "summary_large_image",
      creator: "@bearnacki",
    },

    // If a canonical URL is given, we add it. The metadataBase will turn the relative URL into a fully qualified URL
    ...(canonicalUrlRelative && {
      alternates: { canonical: canonicalUrlRelative },
    }),

    // If you want to add extra tags, you can pass them here
    ...extraTags,
  };
};
