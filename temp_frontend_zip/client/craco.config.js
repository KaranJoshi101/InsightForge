module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Override devServer configuration to use setupMiddlewares
      // This prevents deprecation warnings about onBeforeSetupMiddleware and onAfterSetupMiddleware
      if (webpackConfig.devServer) {
        const { onBeforeSetupMiddleware, onAfterSetupMiddleware, ...restConfig } = webpackConfig.devServer;

        webpackConfig.devServer = {
          ...restConfig,
          setupMiddlewares: (middlewares, devServer) => {
            // Execute onBeforeSetupMiddleware if it exists
            if (onBeforeSetupMiddleware) {
              onBeforeSetupMiddleware(devServer);
            }

            // Execute onAfterSetupMiddleware if it exists
            if (onAfterSetupMiddleware) {
              onAfterSetupMiddleware(devServer);
            }

            return middlewares;
          },
        };
      }

      return webpackConfig;
    },
  },
};
