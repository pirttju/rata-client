module.exports = {
  apps : [{
    name: "rata-client",
    script: "rata-client.js",
    args: "-p",
    restart_delay: 1000,
    watch: true,
    env: {
      "NODE_ENV": "production"
    },
    env_dev: {
      "NODE_ENV": "development"
    }
  }]
};
