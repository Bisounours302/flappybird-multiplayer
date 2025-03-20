module.exports = {
  apps: [{
    name: "flappybird",
    script: "server.js",
    watch: false,
    max_memory_restart: "200M",
    env: {
      NODE_ENV: "production",
    },
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    log_file: "logs/combined.log",
    time: true
  }]
};
