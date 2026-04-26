const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

const TOKEN = process.env.TOKEN;
const MAX_ROLES = 5;

const clubs = {
  "hilal": { name: "هلالي", color: 0x0047AB },
  "nassr": { name: "نصراوي", color: 0xFCD116 },
  "ahli": { name: "أهلاوي", color: 0x006C35 },
  "ittihad": { name: "اتحادي", color: 0xFFC72C },

  "realmadrid": { name: "Real Madrid", color: 0xFFFFFF },
  "barcelona": { name: "Barcelona", color: 0x004D98 },
  "mancity": { name: "Manchester City", color: 0x6CABDD },
  "manutd": { name: "Manchester United", color: 0xDA291C },
  "liverpool": { name: "Liverpool", color: 0xC8102E },
  "chelsea": { name: "Chelsea", color: 0x034694 },
  "arsenal": { name: "Arsenal", color: 0xEF0107 },
  "milan": { name: "AC Milan", color: 0x9B1B30 }
};

async function getOrCreateRole(guild, club) {
  let role = guild.roles.cache.find(r => r.name === club.name);

  if (!role) {
    role = await guild.roles.create({
      name: club.name,
      color: club.color
    });
  }

  return role;
}

// 📩 إرسال الإيمبد
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!clubs") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const embed = new EmbedBuilder()
      .setTitle("🏆 اختر ناديك المفضل")
      .setDescription("يمكنك اختيار حتى 5 أندية عن طريق الضغط على الإيموجيات")
      .setThumbnail("https://cdn.discordapp.com/attachments/1483219896069525665/1497917999758442577/IMG_1685.png?ex=69ef4459&is=69edf2d9&hm=a8d258019415072323e4fd7f2afa23f49f57014ebb1f163e2136e16e2427e377&"); // 🔥 حط رابط صورتك هنا

    const msg = await message.channel.send({ embeds: [embed] });

    for (const emoji of Object.keys(clubs)) {
      try {
        await msg.react(emoji);
      } catch {}
    }

    message.delete().catch(() => {});
  }
});

// إضافة رياكشن
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const club = clubs[reaction.emoji.name];
  if (!club) return;

  const member = await reaction.message.guild.members.fetch(user.id);

  const clubNames = Object.values(clubs).map(c => c.name);
  const userRoles = member.roles.cache.filter(r =>
    clubNames.includes(r.name)
  );

  if (userRoles.size >= MAX_ROLES) {
    await reaction.users.remove(user.id);
    return;
  }

  const role = await getOrCreateRole(reaction.message.guild, club);
  await member.roles.add(role);
});

// إزالة رياكشن
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const club = clubs[reaction.emoji.name];
  if (!club) return;

  const member = await reaction.message.guild.members.fetch(user.id);

  const role = reaction.message.guild.roles.cache.find(r => r.name === club.name);
  if (!role) return;

  await member.roles.remove(role);
});

client.login(TOKEN);
