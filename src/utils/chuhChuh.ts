
export async function chuhChuhAnimated() {
    const lines = [
        "Чух-Чух, їде світло 🚂✨",
        "Чух-Чух, серце квітне 💛🌸",
        "Чух-Чух, далі й далі 🌌🚀",
        "Чух-Чух — ми у Калі 🌞❤️",
    ];

    for (const line of lines) {
        console.log(line);
        await new Promise((resolve) => setTimeout(resolve, 1200)); // пауза між рядками
    }

    console.log("✨🐾 Світло з нами! 🐾✨");
}
