import { W } from "../config.js";
import { drawBackdrop, fadeInScene, transitionTo } from "../fx.js";
import { fetchLeaderboard } from "../leaderboard.js";
import { getPlayer, hasName } from "../player.js";
import { dailySeed } from "../shapes.js";
import { ensureName } from "../namePrompt.js";
import { addGameTopNav } from "../navUi.js";

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

    this.add
      .text(W / 2, 54, "GLOBAL RANKINGS", {
        fontFamily: "Syne, sans-serif",
        fontSize: "24px",
        fontStyle: "700",
        color: "#38bdf8",
      })
      .setOrigin(0.5);

    this.listContainer = this.add.container(0, 0).setDepth(5);
    this.statusText = this.add
      .text(W / 2, 68, "Loading...", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        color: "#64748b",
      })
      .setOrigin(0.5);

    const dailyBoard = `daily-${dailySeed()}`;
    this.makeTab(W / 2 - 90, 96, "ENDLESS", "endless", this.board === "endless");
    this.makeTab(W / 2 + 90, 96, "DAILY", dailyBoard, this.board === dailyBoard);

    this.initBoard();
    fadeInScene(this);
  }

  async initBoard() {
    if (!hasName()) await ensureName();
    await this.loadBoard(this.board);
  }

  makeTab(x, y, label, board, active) {
    const bg = this.add
      .rectangle(x, y, 150, 36, active ? 0x6366f1 : 0x1e293b)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x475569);
    this.add
      .text(x, y, label, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        fontStyle: "700",
        color: "#fff",
      })
      .setOrigin(0.5);
    bg.on("pointerdown", () => {
      if (this.board !== board) this.scene.restart({ board });
    });
  }

  async loadBoard(board) {
    const data = await fetchLeaderboard(board);
    this.listContainer.removeAll(true);
    const me = getPlayer();

    if (data.offline) {
      this.statusText.setText("Server offline — run LAUNCH.bat first");
      return;
    }

    const rows = data.rows || [];
    this.statusText.setText(rows.length ? `Top ${Math.min(15, rows.length)} · worldwide` : "Be the first on the board!");

    rows.slice(0, 15).forEach((row, i) => {
      const y = 130 + i * 38;
      const isMe = row.playerId === me.id;
      this.listContainer.add(
        this.add
          .rectangle(W / 2, y, W - 40, 34, isMe ? 0x6366f1 : 0x111827, isMe ? 0.35 : 0.9)
          .setStrokeStyle(1, isMe ? 0x818cf8 : 0x334155)
      );
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      this.listContainer.add(this.add.text(36, y, medal, { fontSize: "14px", color: "#94a3b8" }).setOrigin(0, 0.5));
      this.listContainer.add(
        this.add
          .text(72, y, row.name, {
            fontFamily: "Outfit, sans-serif",
            fontSize: "14px",
            fontStyle: isMe ? "700" : "600",
            color: isMe ? "#fde047" : "#e2e8f0",
          })
          .setOrigin(0, 0.5)
      );
      this.listContainer.add(
        this.add
          .text(W - 36, y, String(row.score), {
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
