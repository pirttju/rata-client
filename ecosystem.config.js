module.exports = {
  apps : [{
    name: "rata-client",
    script: "rata-client.js",
    args: "-p",
    restart_delay: 3000,
    watch: false,
    env: {
      "NODE_ENV": "production"
    },
    env_dev: {
      "NODE_ENV": "development"
    }
  }]
};
