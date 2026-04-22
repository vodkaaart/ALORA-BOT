// ===== PROTEÇÃO =====
if (global.__botRunning) process.exit();
global.__botRunning = true;

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // 👈 ID do bot
const GUILD_ID = process.env.GUILD_ID;   // 👈 ID do servidor

const OWNER_USERNAME = "Vodka.wad";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Ver perfil de um usuário")
    .addUserOption(opt =>
      opt.setName("usuario")
        .setDescription("Usuário")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Ver banner de um usuário")
    .addUserOption(opt =>
      opt.setName("usuario")
        .setDescription("Usuário")
        .setRequired(false)
    )
].map(cmd => cmd.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registrando comandos...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Comandos registrados!");
  } catch (err) {
    console.log(err);
  }
})();

// ===== READY =====
client.once("clientReady", () => {
  console.log("Bot online:", client.user.tag);
});

// ===== SLASH HANDLER =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const user = interaction.options.getUser("usuario") || interaction.user;

  // ===== PERFIL =====
  if (interaction.commandName === "perfil") {
    const embed = new EmbedBuilder()
      .setTitle(`Perfil de ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 1024 }))
      .setColor(0x2b2d31);

    return interaction.reply({ embeds: [embed] });
  }

  // ===== BANNER =====
  if (interaction.commandName === "banner") {
    const fetchedUser = await client.users.fetch(user.id, { force: true });

    if (!fetchedUser.banner) {
      return interaction.reply("Esse usuário não tem banner 😢");
    }

    const bannerURL = fetchedUser.bannerURL({ size: 1024 });

    const embed = new EmbedBuilder()
      .setTitle(`Banner de ${user.username}`)
      .setImage(bannerURL)
      .setColor(0x2b2d31);

    return interaction.reply({ embeds: [embed] });
  }
});

// ===== PREFIX COMMANDS =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 🔒 PERMISSÃO
  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  const isOwner = message.author.username === OWNER_USERNAME;

  if (!isAdmin && !isOwner) return;

  // ===== !say =====
  if (message.content.startsWith("!say ")) {
    const texto = message.content.slice(5).trim();
    if (!texto) return;

    await message.delete().catch(() => {});
    return message.channel.send(texto);
  }

  // ===== !saybox =====
  if (message.content.startsWith("!saybox ")) {
    const texto = message.content.slice(8).trim();
    if (!texto) return;

    const embed = new EmbedBuilder()
      .setDescription(texto)
      .setColor(0x2b2d31);

    await message.delete().catch(() => {});
    return message.channel.send({ embeds: [embed] });
  }
});

client.login(TOKEN);
