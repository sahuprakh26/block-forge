import { W } from "../config.js";
import { drawBackdrop, fadeInScene, transitionTo } from "../fx.js";
import { fetchLeaderboard, fetchMyRank } from "../leaderboard.js";
import { getPlayer, hasName } from "../player.js";
import { dailySeed } from "../shapes.js";
import { ensureName } from "../namePrompt.js";
import { addGameTopNav } from "../navUi.js";
import { drawGlassPanel, drawTitleGlow, makePillTab, rankColors } from "../uiTheme.js";
import { sfx } from "../audio.js";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("Leaderboard");
  }

  init(data) {
    this.board = data.board || "endless";
  }

  create() {
    drawBackdrop(this, W, 780);
    const goMenu = () => transitionTo(this, "Menu");
    addGameTopNav(this, { onBack: goMenu, onQuit: goMenu, backLabel: "← BACK" });

    drawTitleGlow(this, W / 2, 58, "GLOBAL RANKINGS", "Live worldwide scores");

    this.liveDot = this.add.circle(W / 2 - 72, 88, 5, 0x4ade80, 1).setDepth(20);
    this.statusText = this.add
      .text(W / 2 - 58, 88, "Connecting…", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "600",
        color: "#94a3b8",
      })
      .setOrigin(0, 0.5)
      .setDepth(20);

    this.myRankText = this.add
      .text(W / 2, 108, "", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        fontStyle: "700",
        color: "#fde047",
      })
      .setOrigin(0.5)
      .setDepth(20);

    const dailyBoard = `daily-${dailySeed()}`;
    this.makeTab(W / 2 - 90, 128, "ENDLESS", "endless", this.board === "endless");
    this.makeTab(W / 2 + 90, 128, "DAILY", dailyBoard, this.board === dailyBoard);

    drawGlassPanel(this, W / 2, 430, W - 28, 520, { depth: 2, stroke: 0x475569 });

    this.listContainer = this.add.container(0, 0).setDepth(8);
    this.podiumContainer = this.add.container(0, 0).setDepth(9);

    const refreshBg = this.add
      .rectangle(W - 36, 128, 36, 36, 0x334155, 1)
      .setStrokeStyle(1, 0x64748b)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    this.add
      .text(W - 36, 128, "↻", { fontSize: "20px", color: "#e2e8f0" })
      .setOrigin(0.5)
      .setDepth(21);
    refreshBg.on("pointerdown", () => {
      sfx.play("click");
      this.scene.restart({ board: this.board });
    });

    this.initBoard();
    fadeInScene(this);
    this.tweens.add({
      targets: this.liveDot,
      alpha: { from: 1, to: 0.35 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  makeTab(x, y, label, board, active) {
    makePillTab(this, x, y, label, active, () => {
      if (this.board !== board) this.scene.restart({ board });
    });
  }

  async initBoard() {
    if (!hasName()) await ensureName();
    await this.loadBoard(this.board);
    const me = getPlayer();
    const rank = await fetchMyRank(this.board, me.id);
    if (rank) {
      this.myRankText.setText(`Your rank: #${rank.rank}  ·  ${rank.score} pts  ·  ${rank.total} players`);
    } else if (hasName()) {
      this.myRankText.setText("Play endless or daily to claim your rank!");
    }
  }

  drawPodium(rows) {
    this.podiumContainer.removeAll(true);
    const top3 = rows.slice(0, 3);
    if (!top3.length) return;

    const slots = [
      { x: W / 2 - 100, y: 200, h: 72, i: 1 },
      { x: W / 2, y: 178, h: 96, i: 0 },
      { x: W / 2 + 100, y: 208, h: 64, i: 2 },
    ];

    slots.forEach((slot) => {
      const row = top3[slot.i];
      if (!row) return;
      const rc = rankColors(slot.i);
      const block = this.add.rectangle(slot.x, slot.y, 88, slot.h, rc.bg, 0.95).setStrokeStyle(2, rc.stroke);
      this.podiumContainer.add(block);
      this.podiumContainer.add(
        this.add.text(slot.x, slot.y - slot.h * 0.35, rc.medal, { fontSize: "22px" }).setOrigin(0.5)
      );
      this.podiumContainer.add(
        this.add
          .text(slot.x, slot.y + 4, row.name, {
            fontFamily: "Outfit, sans-serif",
            fontSize: "11px",
            fontStyle: "700",
            color: rc.text,
          })
          .setOrigin(0.5)
      );
      this.podiumContainer.add(
        this.add
          .text(slot.x, slot.y + slot.h * 0.32, String(row.score), {
            fontFamily: "Outfit, sans-serif",
            fontSize: "14px",
            fontStyle: "800",
            color: rc.text,
          })
          .setOrigin(0.5)
      );
    });
  }

  async loadBoard(board) {
    this.statusText.setText("Loading live scores…");
    const data = await fetchLeaderboard(board);
    this.listContainer.removeAll(true);
    this.podiumContainer.removeAll(true);
    const me = getPlayer();

    if (data.offline) {
      this.liveDot.setFillStyle(0xf87171);
      this.statusText.setText("Rankings offline — API not ready yet");
      this.statusText.setColor("#f87171");
      return;
    }

    this.liveDot.setFillStyle(data.source === "gist" ? 0xfbbf24 : 0x4ade80);
    const rows = data.rows || [];
    const src = data.source === "gist" ? "read-only preview" : "live";
    this.statusText.setText(
      rows.length ? `Top ${Math.min(12, rows.length)} · ${src} · worldwide` : "Be the first on the board!"
    );
    this.statusText.setColor("#94a3b8");

    this.drawPodium(rows);

    rows.slice(0, 12).forEach((row, i) => {
      const y = 268 + i * 40;
      const isMe = row.playerId === me.id;
      const rc = rankColors(i);
      const rowW = W - 52;
      const bgColor = isMe ? 0x4338ca : rc.bg;
      const alpha = isMe ? 0.55 : i < 3 ? 0.25 : 0.92;

      this.listContainer.add(
        this.add.rectangle(W / 2, y, rowW, 36, bgColor, alpha).setStrokeStyle(1, isMe ? 0xa5b4fc : rc.stroke, 0.7)
      );
      const rankLabel = i < 3 ? rc.medal : `${i + 1}`;
      this.listContainer.add(
        this.add
          .text(40, y, rankLabel, { fontSize: i < 3 ? "16px" : "13px", color: "#94a3b8" })
          .setOrigin(0, 0.5)
      );
      this.listContainer.add(
        this.add
          .text(76, y, row.name, {
            fontFamily: "Outfit, sans-serif",
            fontSize: "14px",
            fontStyle: isMe ? "800" : "600",
            color: isMe ? "#fde047" : "#e2e8f0",
          })
          .setOrigin(0, 0.5)
      );
      this.listContainer.add(
        this.add
          .text(W - 40, y, String(row.score), {
            fontFamily: "Outfit, sans-serif",
            fontSize: "15px",
            fontStyle: "800",
            color: "#38bdf8",
          })
          .setOrigin(1, 0.5)
      );
    });
  }
}
