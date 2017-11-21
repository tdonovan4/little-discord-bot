const bot = require('./bot.js');
const sql = require('sqlite');
const config = require('./args.js').getConfig();
const mustache = require('mustache');
var lang = require('./localization.js').getLocalization();

function addCmd(msg, args) {
  sql.run('INSERT INTO customCmds (serverId, userId, name, action, arg) VALUES (?, ?, ?, ?, ?)', [msg.guild.id, msg.author.id, args[0], args[1], args.slice(2).join(' ')])
    .catch(error => {
      console.log(error);
    });
}

module.exports = {
  addCmd: async function(msg, args) {
    var cmds = await this.getCmds(msg, args);
    //Check if user have too many commands (ignore if admin or superuser)
    if (msg.member.permissions.has('ADMINISTRATOR') ||
      config.superusers.find(x => x == msg.author.id) != undefined ||
      cmds.filter(x => x.userId == msg.author.id).length < config.custcmd.maxCmdsPerUser) {
      //Check if cmd already exists
      if (cmds != undefined && cmds.find(x => x.name == args[0]) != undefined) {
        bot.printMsg(msg, lang.error.cmdAlreadyExists);
      } else {
        //Max number of custom commands is 100
        if (cmds == undefined || cmds.length <= 100) {
          //Check if there is enough args and if length of name < 25 characters
          if (args.length >= 3 && args[0].length < 25) {
            //Add command to db
            if (args[1] == 'say' || args[1] == 'play') {
              addCmd(msg, args);
              bot.printMsg(msg, lang.custcmd.cmdAdded);
              return;
            }
          }
          //Wrong usage
          bot.printMsg(msg, lang.error.usage);
        } else {
          //Too much commands
          bot.printMsg(msg, lang.error.tooMuch.cmds);
        }
      }
    } else {
      //User have too much commands
      bot.printMsg(msg, lang.error.tooMuch.cmdsUser);
    }
  },
  removeCmd: function(msg, args) {
    sql.open('./storage/data.db').then(() => {
      sql.all(`SELECT * FROM customCmds WHERE serverId = ${msg.guild.id} AND name = "${args[0]}"`)
        .then(row => {
          if (row.length > 0) {
            sql.all(`DELETE FROM customCmds WHERE serverId = ${msg.guild.id} AND name = "${args[0]}"`)
              .then(() => {
                bot.printMsg(msg, lang.custcmdremove.cmdRemoved)
              }).catch(error => {
                console.log(error);
              });
          } else {
            //Command not found
            bot.printMsg(msg, lang.error.notFound.cmd);
          }
        }).catch(error => {
          //Check if table exist
          sql.run('CREATE TABLE IF NOT EXISTS customCmds (serverId TEXT, userId TEXT, name TEXT, action TEXT, arg TEXT)')
            .catch(error => {
              console.log(error);
            });
        });
      sql.close();
    }).catch(error => {
      console.log(error);
    });
  },
  getCmds: function(msg) {
    return new Promise((resolve, reject) => {
      sql.open('./storage/data.db').then(() => {
        sql.all(`SELECT * FROM customCmds WHERE serverId = ${msg.guild.id}`)
          .then(row => {
            resolve(row);
          }).catch(error => {
            //Check if table exist
            sql.run('CREATE TABLE IF NOT EXISTS customCmds (serverId TEXT, userId TEXT, name TEXT, action TEXT, arg TEXT)')
              .then(() => {
                resolve(undefined);
              }).catch(error => {
                console.log(error);
              });
          });
        sql.close();
      }).catch(error => {
        console.log(error);
      });
    });
  },
  printCmds: async function(msg, args) {
    var cmds = await this.getCmds(msg);
    if (cmds.length > 0) {
      var cmd = cmds.find(x => x.name == args[0]);
      if (cmd != undefined) {
        //Print info about the command
        const Discord = require("discord.js");

        var embed = new Discord.RichEmbed();
        embed.title = cmd.name;
        embed.color = 0x3aa00a;
        embed.addField(name = lang.custcmdlist.action, value = cmd.action, inline = true)
        embed.addField(name = lang.custcmdlist.creator, value = msg.guild.members.get(cmd.userId).user.username, inline = true)
        embed.addField(name = lang.custcmdlist.arg, value = cmd.arg, inline = false);
        msg.channel.send({
          embed
        });
      } else {
        if (args.length == 0) {
          //All commands
          var names = cmds.map(x => x.name);
        } else {
          //User's commands
          var names = cmds.filter(x => x.userId == msg.mentions.users.first().id).map(x => x.name);
        }
        if (names != undefined) {
          var output = '';
          var spaces = 25;

          for (i = 0; i < names.length; i++) {
            output += names[i] + Array(spaces - names[i].length).join(" ");
            if ((i + 1) % 5 == 0) {
              output += '\n';
            }
          }
          msg.channel.send(output, {
            code: 'css'
          });
          //Little message
          msg.channel.send(mustache.render(lang.custcmdlist.msg, {
            config
          }))
        }
      }
    } else {
      bot.printMsg(msg, lang.custcmdlist.empty);
    }
  }
}