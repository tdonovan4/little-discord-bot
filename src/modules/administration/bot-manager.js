const bot = require('../../bot.js');
var lang = require('../../localization.js').getLocalization();

module.exports = {
  KillCommand: class extends bot.Command {
    constructor() {
      super({
        name: 'kill',
        aliases: [],
        category: 'administration',
        permLvl: 3
      });
    }
    execute(msg, args) {
      console.log(lang.general.stopping);
      process.exitCode = 0;
      process.exit();
    }
  },
  RestartCommand: class extends bot.Command {
    constructor() {
      super({
        name: 'restart',
        aliases: [],
        category: 'administration',
        permLvl: 3
      });
    }
    execute(msg, args) {
      //Spawn new process
      var spawn = require('child_process').spawn;

      var child = spawn('node', ['./src/bot.js'], {
        detached: true,
        shell: true,
        stdio: 'ignore'
      });
      child.unref();

      console.log(lang.general.restarting);

      //Exit this process
      process.exitCode = 0;
      process.exit();
    }
  }
}
