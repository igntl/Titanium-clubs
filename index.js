const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const MAX_ROLES = 5;

// 🇸🇦 الأندية السعودية
const saudiClubs = [
  { label: "الهلال", value: "hilal", color: 0x0047AB },
  { label: "النصر", value: "nassr", color: 0xFCD116 },
  { label: "الأهلي", value: "ahli", color: 0x006C35 },
  { label: "الاتحاد", value: "ittihad", color: 0x000000 }
];

// 🌍 الأندية الأوروبية
const euClubs = [
  { label: "Real Madrid", value: "realmadrid", color: 0xFFFFFF },
  { label: "Barcelona", value: "barcelona", color: 0x004D98 },
  { label: "Manchester City", value: "mancity", color: 0x6CABDD },
  { label: "Manchester United", value: "manutd", color: 0xDA291C },
  { label: "Liverpool", value: "liverpool", color: 0xC8102E },
  { label: "AC Milan", value: "milan", color: 0x9B1B30 },
  { label: "Chelsea", value: "chelsea", color: 0x034694 },
  { label: "Arsenal", value: "arsenal", color: 0xEF0107 }
];

const clubs = [...saudiClubs, ...euClubs];

// إنشاء أو جلب رتبة
async function getOrCreateRole(guild, club) {
  let role = guild.roles.cache.find(r => r.name === club.label);

  if (!role) {
    role = await guild.roles.create({
      name: club.label,
      color: club.color,
      reason: "Club Role Auto"
    });
  }

  return role;
}

// 📩 أمر إرسال القائمة
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!clubs") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const embed = new EmbedBuilder()
      .setTitle("🏆 اختر أنديتك المفضلة")
      .setDescription(
        "🔹 الأندية السعودية:\n" +
        saudiClubs.map(c => `• ${c.label}`).join("\n") +
        "\n\n🔹 الأندية الأوروبية:\n" +
        euClubs.map(c => `• ${c.label}`).join("\n") +
        "\n\nيمكنك اختيار حتى 5 أندية"
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("clubs_select")
      .setPlaceholder("اختر الأندية")
      .setMinValues(1)
      .setMaxValues(MAX_ROLES)
      .addOptions([
        ...clubs.map(c => ({
          label: c.label,
          value: c.value
        })),
        {
          label: "❌ إزالة كل الأندية",
          value: "reset"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({ embeds: [embed], components: [row] });

    message.delete().catch(() => {});
  }
});

// 🎯 التعامل مع الاختيار
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "clubs_select") return;

  const member = interaction.member;
  const clubNames = clubs.map(c => c.label);

  // 🧹 تصفير
  if (interaction.values.includes("reset")) {
    const oldRoles = member.roles.cache.filter(r =>
      clubNames.includes(r.name)
    );

    for (const role of oldRoles.values()) {
      await member.roles.remove(role);
    }

    return interaction.reply({
      content: "تم حذف جميع الأندية ❌",
      ephemeral: true
    });
  }

  // حذف القديم
  const oldRoles = member.roles.cache.filter(r =>
    clubNames.includes(r.name)
  );

  for (const role of oldRoles.values()) {
    await member.roles.remove(role);
  }

  // إضافة الجديد
  for (const value of interaction.values) {
    const club = clubs.find(c => c.value === value);
    const role = await getOrCreateRole(interaction.guild, club);
    await member.roles.add(role);
  }

  await interaction.reply({
    content: "تم تحديث أنديتك ✅",
    ephemeral: true
  });
});

client.login(TOKEN);
