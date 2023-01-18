// General config settings

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  input: {
    activePointers: 3, // config addition for the multitouch support
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// ===========================================
// Global variables
// ===========================================

let cursors,
  player,
  hearts,
  fires,
  scoreText,
  score = 0,
  level = 1,
  playerSpeed = 300,
  jumpPower = 350,
  pickupSound,
  bgSound,
  gameoverSound,
  onButton,
  offButton,
  muteSounds = false,
  gameoverButton,
  gameoverText;
  
  // Advanced jump
let currentJumpPower = jumpPower;
let maxJumpPower = jumpPower * 2;

// ============================================
// Game Functions
// ============================================

// Collect hearts function
function collectHeart(player, heart) {
  heart.disableBody(true, true);
  score = score + 10;
  scoreText.text = "Score: " + score;
  if (!muteSounds) {
  pickupSound.play();
 }
// Check when all hearts collected
  if (hearts.countActive(true) == 0) {
    level = level + 1;
    levelText.text = "Level: " + level;
    playerSpeed = playerSpeed + 50;
    createFire();
    // Create a new hearts when all previous were collected
    hearts.children.iterate(function (heart) {
      heart.enableBody(true, heart.x, 0, true, true);
    });
  }
}

// Create new fire
function createFire(scale = 1) {
  const fire = fires.create(360, 0, "fire");
  fire.setScale(scale, scale).refreshBody();
  fire.setBounce(1);
  fire.setVelocity(Phaser.Math.Between(-500, 500), 20);
  fire.setCollideWorldBounds(true);
}

// Fire hit player
function hitFire(player, fire) {
  this.physics.pause();
  player.anims.play("turn");
  player.setTint(0xff0000);
  bgSound.stop();
  gameoverSound.play();
  gameoverButton.visible = true;
  gameoverText.visible = true;
}

// =================================================
// Preload
// =================================================

function preload() {
  this.load.image("world", "assets/img/world.png");
  this.load.image("ground", "assets/img/platform.png");
  this.load.image("hearts", "assets/img/heart.png");
  this.load.image("fire", "assets/img/fire.png");
  this.load.spritesheet("monster", "assets/img/monster.png", {
    frameWidth: 50,
    frameHeight: 50,
  });
  
  this.load.spritesheet("walkleft", "assets/img/walkleft.png", {
    frameWidth: 50,
    frameHeight: 50,
  });
  
  this.load.spritesheet("walkright", "assets/img/walkright.png", {
    frameWidth: 50,
    frameHeight: 50,
  });

  // Load music
  this.load.audio("pickup", ["assets/sounds/pickup.ogg", "assets/sounds/pickup.mp3"]);
  this.load.audio("music", ["assets/sounds/bgmusic.ogg", "assets/sounds/bgmusic.mp3"]);
  this.load.audio("gameover", ["assets/sounds/gameover.ogg", "assets/sounds/gameover.mp3"]);
}

// ==============================================
// Create
// ==============================================

function create() {
  const bgImage = this.add.image(0, 0, "world").setOrigin(0, 0);
  bgImage.scaleY = 2.2;
  bgImage.scaleX = 2.5;
   
  // Game Text / Buttons
  scoreText = this.add.text(20, 20, "Score: 0", {
    fontSize: "36px",
    fill: "#fff",
  });
  
  levelText = this.add.text(520, 20, "Level: 1", {
    fontSize: "36px",
    fill: "#fff",
  });
  
  gameoverText = this.add.text(200, 350, "Game Over", { fontSize: "64px", fill: "#fff"});
  gameoverText.visible = false;

  gameoverButton = this.add.text(170, 450, "-> Start a New Game <-", { fontSize: "30px", fill: "#fff"})
     .setInteractive()
     .on("pointerdown", () => location.reload());
  gameoverButton.visible = false;

  onButton = this.add.text(250, 30, "ON / Music ", { fontSize: "23px", fill: "#fff" })
    .setInteractive()
    .on("pointerdown", () => {
      bgSound.play();
      muteSounds = false;
    });

  offButton = this.add.text(390, 30, " / OFF", { fontSize: "23px", fill: "#fff" })
    .setInteractive()
    .on("pointerdown", () => {
      bgSound.stop();
      muteSounds = true;
    });

  // Create  platforms
  const platforms = this.physics.add.staticGroup();
  platforms.create(360, 1270, "ground").setScale(2, 2).refreshBody();
  platforms.create(600, 1075, "ground");
  platforms.create(60, 900, "ground");
  platforms.create(420, 750, "ground").setScale(0.3, 1).refreshBody();
  platforms.create(750, 600, "ground");

  // Create player
  player = this.physics.add.sprite(config.scale.width / 2, 1200, "monster");
  player.setBounce(0.3);
  player.setCollideWorldBounds(true);

  // Add collision detection between player and platforms
  this.physics.add.collider(player, platforms);
  cursors = this.input.keyboard.createCursorKeys();

  // Game Controler
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("walkleft", { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "monster", frame: 0 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("walkright", { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1,
  });

  // Create hearts
  hearts = this.physics.add.group({
    key: "hearts",
    repeat: 9,
    setXY: { x: 30, y: 5, stepX: config.scale.width / 10, stepY: -30 },
  });
  this.physics.add.collider(hearts, platforms);

  // Jumping effect of hearts
  hearts.children.iterate(function (heart) {
    heart.setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
  });

  // Player + hearts
  this.physics.add.overlap(player, hearts, collectHeart, null, this);

  // Fire + Player
  fires = this.physics.add.group();
  this.physics.add.collider(fires, platforms);
  this.physics.add.collider(player, fires, hitFire, null, this);
  
  // Create sounds
  gameoverSound = this.sound.add("gameover", { volume: 0.2 });
  pickupSound = this.sound.add("pickup", { volume: 0.2 });
  bgSound = this.sound.add("music", { volume: 0.2, loop: true });
  bgSound.play();
  
}

// =============================================
// Update
// =============================================

function update() {
  // tp (touchPointer)
  const tp = this.input.activePointer;
  // Running left
  if (cursors.left.isDown || (tp.isDown && tp.x < 200)) {
    player.anims.play("left", true);
    player.setVelocityX(-playerSpeed);
  // Running right
  } else if (cursors.right.isDown || (tp.isDown && tp.x > 520)) {
    player.anims.play("right", true);
    player.setVelocityX(playerSpeed);
  } else {
    player.anims.play("turn");
    player.setVelocityX(0);
  }

  // Advanced jump(works only with keyboard)
  if (cursors.up.isDown && player.body.touching.down) {
    if (currentJumpPower < maxJumpPower) {
        currentJumpPower = currentJumpPower + 2;
    }
  
  // Jump when the player let the top key down
  } else if (player.body.touching.down && (currentJumpPower > jumpPower)) {
   player.setVelocityY(-currentJumpPower);
   currentJumpPower = jumpPower;
  }

  // Basic jump (works on the touch screen)
  if (player.body.touching.down && (tp.isDown && tp.x > 200 && tp.x < 520)) {
      player.setVelocityY(-jumpPower);
  }
}
