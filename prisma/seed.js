import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.player.createMany({
    data: [
      // 1등급 (Top 10% - 3명)
      {
        playerName: "Lionel Messi",
        rare: 1,
        speed: 85,
        finishing: 90,
        pass: 90,
        defense: 40,
        stamina: 80,
      },
      {
        playerName: "Cristiano Ronaldo",
        rare: 1,
        speed: 88,
        finishing: 90,
        pass: 80,
        defense: 40,
        stamina: 85,
      },
      {
        playerName: "Kylian Mbappe",
        rare: 1,
        speed: 90,
        finishing: 88,
        pass: 80,
        defense: 45,
        stamina: 85,
      },

      // 2등급 (Top 20% - 6명)
      {
        playerName: "Neymar",
        rare: 2,
        speed: 85,
        finishing: 85,
        pass: 88,
        defense: 40,
        stamina: 80,
      },
      {
        playerName: "Kevin De Bruyne",
        rare: 2,
        speed: 75,
        finishing: 80,
        pass: 90,
        defense: 55,
        stamina: 80,
      },
      {
        playerName: "Mohamed Salah",
        rare: 2,
        speed: 88,
        finishing: 85,
        pass: 80,
        defense: 50,
        stamina: 85,
      },
      {
        playerName: "Robert Lewandowski",
        rare: 2,
        speed: 78,
        finishing: 90,
        pass: 75,
        defense: 45,
        stamina: 80,
      },
      {
        playerName: "Harry Kane",
        rare: 2,
        speed: 75,
        finishing: 88,
        pass: 78,
        defense: 50,
        stamina: 80,
      },
      {
        playerName: "Erling Haaland",
        rare: 2,
        speed: 88,
        finishing: 90,
        pass: 70,
        defense: 45,
        stamina: 85,
      },

      // 3등급 (Top 26.7% - 8명)
      {
        playerName: "Federico Valverde",
        rare: 3,
        speed: 85,
        finishing: 75,
        pass: 80,
        defense: 70,
        stamina: 85,
      },
      {
        playerName: "Joshua Kimmich",
        rare: 3,
        speed: 75,
        finishing: 70,
        pass: 85,
        defense: 80,
        stamina: 80,
      },
      {
        playerName: "Antoine Griezmann",
        rare: 3,
        speed: 80,
        finishing: 80,
        pass: 80,
        defense: 60,
        stamina: 75,
      },
      {
        playerName: "Trent Alexander-Arnold",
        rare: 3,
        speed: 82,
        finishing: 70,
        pass: 85,
        defense: 75,
        stamina: 78,
      },
      {
        playerName: "Bukayo Saka",
        rare: 3,
        speed: 85,
        finishing: 78,
        pass: 75,
        defense: 70,
        stamina: 80,
      },
      {
        playerName: "Luka Modric",
        rare: 3,
        speed: 75,
        finishing: 70,
        pass: 88,
        defense: 70,
        stamina: 75,
      },
      {
        playerName: "Bruno Fernandes",
        rare: 3,
        speed: 78,
        finishing: 75,
        pass: 85,
        defense: 70,
        stamina: 78,
      },
      {
        playerName: "Martin Odegaard",
        rare: 3,
        speed: 78,
        finishing: 75,
        pass: 85,
        defense: 65,
        stamina: 78,
      },

      // 4등급 (Top 23.3% - 7명)
      {
        playerName: "Paulo Dybala",
        rare: 4,
        speed: 80,
        finishing: 80,
        pass: 80,
        defense: 55,
        stamina: 75,
      },
      {
        playerName: "Raheem Sterling",
        rare: 4,
        speed: 85,
        finishing: 78,
        pass: 75,
        defense: 55,
        stamina: 78,
      },
      {
        playerName: "Marquinhos",
        rare: 4,
        speed: 75,
        finishing: 60,
        pass: 70,
        defense: 85,
        stamina: 80,
      },
      {
        playerName: "Jordi Alba",
        rare: 4,
        speed: 80,
        finishing: 60,
        pass: 75,
        defense: 80,
        stamina: 78,
      },
      {
        playerName: "Declan Rice",
        rare: 4,
        speed: 78,
        finishing: 60,
        pass: 75,
        defense: 80,
        stamina: 80,
      },
      {
        playerName: "William Saliba",
        rare: 4,
        speed: 75,
        finishing: 55,
        pass: 70,
        defense: 85,
        stamina: 75,
      },
      {
        playerName: "Leroy Sane",
        rare: 4,
        speed: 85,
        finishing: 78,
        pass: 75,
        defense: 60,
        stamina: 78,
      },

      // 5등급 (Top 20% - 6명)
      {
        playerName: "Kai Havertz",
        rare: 5,
        speed: 78,
        finishing: 75,
        pass: 75,
        defense: 60,
        stamina: 75,
      },
      {
        playerName: "Lamine Yamal",
        rare: 5,
        speed: 80,
        finishing: 75,
        pass: 75,
        defense: 55,
        stamina: 75,
      },
      {
        playerName: "Mason Mount",
        rare: 5,
        speed: 78,
        finishing: 73,
        pass: 75,
        defense: 65,
        stamina: 75,
      },
      {
        playerName: "Reece James",
        rare: 5,
        speed: 80,
        finishing: 65,
        pass: 75,
        defense: 78,
        stamina: 78,
      },
      {
        playerName: "Phil Foden",
        rare: 5,
        speed: 82,
        finishing: 78,
        pass: 78,
        defense: 60,
        stamina: 75,
      },
      {
        playerName: "Pedri",
        rare: 5,
        speed: 80,
        finishing: 75,
        pass: 80,
        defense: 65,
        stamina: 75,
      },
    ],
  });
}

main()
  .then(() => {
    console.log("Seeding complete");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
