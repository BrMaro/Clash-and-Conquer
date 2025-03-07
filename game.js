/**
 * Clash & Conquer - Rock, Paper, Scissors Simulation Game
 * Main game logic and canvas rendering
 */

// Game constants
const TYPES = {
    ROCK: "rock",
    PAPER: "paper",
    SCISSORS: "scissors",
}

const COLORS = {
    [TYPES.ROCK]: "#8B4513", // Brown
    [TYPES.PAPER]: "#E0E0E0", // Light gray
    [TYPES.SCISSORS]: "#C0C0C0", // Silver
}

const EMOJIS = {
    [TYPES.ROCK]: "🪨",
    [TYPES.PAPER]: "📄",
    [TYPES.SCISSORS]: "✂️",
}

const VICTORY_MESSAGES = {
    [TYPES.ROCK]: "Rocks have crushed all opposition!",
    [TYPES.PAPER]: "Paper has covered everything in its path!",
    [TYPES.SCISSORS]: "Scissors have cut down all competitors!",
}

// Game class
class ClashAndConquer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId)
        this.ctx = this.canvas.getContext("2d")
        this.entities = []
        this.speed = 1
        this.speedMultiplier = 1
        this.isRunning = false
        this.playerChoice = null
        this.entityCounts = {
            [TYPES.ROCK]: 0,
            [TYPES.PAPER]: 0,
            [TYPES.SCISSORS]: 0,
        }
        this.morphLosers = false // New option for morphing instead of disappearing

        // Initialize canvas size
        this.resizeCanvas()
        window.addEventListener("resize", () => this.resizeCanvas())

        // Store instance globally for access from UI
        window.ClashAndConquerInstance = this
    }

    resizeCanvas() {
        const container = this.canvas.parentElement
        this.canvas.width = container.clientWidth
        this.canvas.height = 400 // Fixed height or you can make it responsive too

        // Redraw if game is running
        if (this.isRunning) {
            this.draw()
        }
    }

    init(playerChoice = null, entitiesPerType = 20, morphLosers = false) {
        // Warn the player if they are spawning many sprites on a small screen
        const spriteThreshold = 30;
        if (entitiesPerType > spriteThreshold && !document.fullscreenElement) {
            alert("Warning: Spawning a large number of sprites on a small screen may cause performance issues. For the best experience, please switch to full screen mode before starting the simulation.");
        }

        this.playerChoice = playerChoice;
        this.morphLosers = morphLosers;
        this.entities = [];
        this.speed = 1;
        this.speedMultiplier = 1;
        this.isRunning = true;

        // Reset entity counts
        this.entityCounts = {
            [TYPES.ROCK]: 0,
            [TYPES.PAPER]: 0,
            [TYPES.SCISSORS]: 0,
        };

        // Create entities based on user input
        this.createEntities(TYPES.ROCK, entitiesPerType);
        this.createEntities(TYPES.PAPER, entitiesPerType);
        this.createEntities(TYPES.SCISSORS, entitiesPerType);

        // Update counters and speed display
        this.updateCounters();
        this.updateSpeedDisplay();

        // Start game loop
        this.gameLoop();
    }

    createEntities(type, count) {
        const size = 12
        const margin = size * 2

        for (let i = 0; i < count; i++) {
            // Ensure entities don't spawn too close to the edges
            const x = margin + Math.random() * (this.canvas.width - margin * 2)
            const y = margin + Math.random() * (this.canvas.height - margin * 2)

            // Random velocity
            const angle = Math.random() * Math.PI * 2
            const speed = 0.5 + Math.random() * 1.5
            const vx = Math.cos(angle) * speed
            const vy = Math.sin(angle) * speed

            this.entities.push({
                type,
                x,
                y,
                vx,
                vy,
                size,
            })

            this.entityCounts[type]++
        }
    }

    gameLoop() {
        if (!this.isRunning) return

        this.update()
        this.draw()
        this.checkGameEnd()

        requestAnimationFrame(() => this.gameLoop())
    }

    update() {
        // Move entities
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i]

            // Update position
            entity.x += entity.vx * this.speed
            entity.y += entity.vy * this.speed

            // Bounce off walls
            if (entity.x - entity.size < 0 || entity.x + entity.size > this.canvas.width) {
                entity.vx = -entity.vx
                // Keep within bounds
                entity.x = Math.max(entity.size, Math.min(this.canvas.width - entity.size, entity.x))
            }

            if (entity.y - entity.size < 0 || entity.y + entity.size > this.canvas.height) {
                entity.vy = -entity.vy
                // Keep within bounds
                entity.y = Math.max(entity.size, Math.min(this.canvas.height - entity.size, entity.y))
            }
        }

        // Check collisions
        this.checkCollisions()
    }

    checkCollisions() {
        const entitiesToRemove = []
        const entitiesToMorph = []

        // Check each pair of entities
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const entityA = this.entities[i]
                const entityB = this.entities[j]

                // Calculate distance between entities
                const dx = entityB.x - entityA.x
                const dy = entityB.y - entityA.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                // Check if entities are colliding
                if (distance < entityA.size + entityB.size) {
                    // Same type - bounce off each other
                    if (entityA.type === entityB.type) {
                        // Simple elastic collision
                        const angle = Math.atan2(dy, dx)
                        const sin = Math.sin(angle)
                        const cos = Math.cos(angle)

                        // Rotate velocities
                        const vx1 = entityA.vx * cos + entityA.vy * sin
                        const vy1 = entityA.vy * cos - entityA.vx * sin
                        const vx2 = entityB.vx * cos + entityB.vy * sin
                        const vy2 = entityB.vy * cos - entityB.vx * sin

                        // Swap velocities
                        const temp_vx1 = vx2
                        const temp_vy1 = vy1
                        const temp_vx2 = vx1
                        const temp_vy2 = vy2

                        // Rotate back
                        entityA.vx = temp_vx1 * cos - temp_vy1 * sin
                        entityA.vy = temp_vx1 * sin + temp_vy1 * cos
                        entityB.vx = temp_vx2 * cos - temp_vy2 * sin
                        entityB.vy = temp_vx2 * sin + temp_vy2 * cos

                        // Move apart to prevent sticking
                        const overlap = entityA.size + entityB.size - distance
                        const moveX = (overlap * cos) / 2
                        const moveY = (overlap * sin) / 2

                        entityA.x -= moveX
                        entityA.y -= moveY
                        entityB.x += moveX
                        entityB.y += moveY
                    }
                    // Different types - determine winner
                    else {
                        let loser = null
                        let winner = null
                        let loserEntity = null
                        let winnerEntity = null

                        // Rock beats scissors
                        if (entityA.type === TYPES.ROCK && entityB.type === TYPES.SCISSORS) {
                            loser = j
                            winner = i
                            loserEntity = entityB
                            winnerEntity = entityA
                        } else if (entityA.type === TYPES.SCISSORS && entityB.type === TYPES.ROCK) {
                            loser = i
                            winner = j
                            loserEntity = entityA
                            winnerEntity = entityB
                        }
                        // Scissors beats paper
                        else if (entityA.type === TYPES.SCISSORS && entityB.type === TYPES.PAPER) {
                            loser = j
                            winner = i
                            loserEntity = entityB
                            winnerEntity = entityA
                        } else if (entityA.type === TYPES.PAPER && entityB.type === TYPES.SCISSORS) {
                            loser = i
                            winner = j
                            loserEntity = entityA
                            winnerEntity = entityB
                        }
                        // Paper beats rock
                        else if (entityA.type === TYPES.PAPER && entityB.type === TYPES.ROCK) {
                            loser = j
                            winner = i
                            loserEntity = entityB
                            winnerEntity = entityA
                        } else if (entityA.type === TYPES.ROCK && entityB.type === TYPES.PAPER) {
                            loser = i
                            winner = j
                            loserEntity = entityA
                            winnerEntity = entityB
                        }

                        // Handle loser based on game mode
                        if (loser !== null) {
                            if (this.morphLosers) {
                                if (!entitiesToMorph.some((item) => item.index === loser)) {
                                    entitiesToMorph.push({
                                        index: loser,
                                        newType: winnerEntity.type,
                                        entity: loserEntity,
                                    })
                                }
                            } else if (!entitiesToRemove.includes(loser)) {
                                entitiesToRemove.push(loser)
                            }
                        }
                    }
                }
            }
        }

        // Handle morphing entities
        if (entitiesToMorph.length > 0) {
            for (const item of entitiesToMorph) {
                const oldType = this.entities[item.index].type
                this.entities[item.index].type = item.newType

                // Update counts
                this.entityCounts[oldType]--
                this.entityCounts[item.newType]++
            }
        }

        // Remove losing entities
        if (entitiesToRemove.length > 0) {
            // Sort in descending order to avoid index shifting issues
            entitiesToRemove.sort((a, b) => b - a)

            for (const index of entitiesToRemove) {
                const removedType = this.entities[index].type
                this.entities.splice(index, 1)
                this.entityCounts[removedType]--
            }
        }

        // Update counters if any changes were made
        if (entitiesToRemove.length > 0 || entitiesToMorph.length > 0) {
            this.updateCounters()
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Draw entities
        for (const entity of this.entities) {
            this.ctx.fillStyle = COLORS[entity.type]
            this.ctx.beginPath()
            this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2)
            this.ctx.fill()

            // Draw emoji
            this.ctx.font = `${entity.size}px Arial`
            this.ctx.textAlign = "center"
            this.ctx.textBaseline = "middle"
            this.ctx.fillText(EMOJIS[entity.type], entity.x, entity.y)
        }
    }

    updateCounters() {
        document.getElementById("rock-count").textContent = this.entityCounts[TYPES.ROCK]
        document.getElementById("paper-count").textContent = this.entityCounts[TYPES.PAPER]
        document.getElementById("scissors-count").textContent = this.entityCounts[TYPES.SCISSORS]
    }

    checkGameEnd() {
        // Count types remaining
        const typesRemaining = Object.values(this.entityCounts).filter((count) => count > 0).length

        // If only one type remains, game is over
        // If in fullscreen, wait 1 second then exit
        if (typesRemaining === 1) {
            this.isRunning = false

            // Find the winning type
            let winnerType = null
            for (const type in this.entityCounts) {
                if (this.entityCounts[type] > 0) {
                    winnerType = type
                    break
                }
            }

            if (winnerType) {
                this.showVictoryMessage(winnerType)
            }
        }
    }

    showVictoryMessage(winnerType) {
        const victoryMessage = document.getElementById("victory-message")
        const winnerDisplay = document.getElementById("winner-display")
        const victoryText = document.getElementById("victory-text")

        // Set winner emoji and message
        winnerDisplay.textContent = EMOJIS[winnerType]
        victoryText.textContent = VICTORY_MESSAGES[winnerType]

        // Add class if player chose the winner
        if (this.playerChoice === winnerType) {
            victoryText.innerHTML += "<br><strong>Your champion won!</strong>"
        }

        // Show victory message
        victoryMessage.style.display = "block"
    }

    speedUp() {
        if (this.speedMultiplier >= 8) {
            this.speedMultiplier = 1;
            this.speed = 1;
        } else {
            this.speedMultiplier *= 2;
            this.speed *= 2;
        }
        this.updateSpeedDisplay();
    }

    stop() {
        this.isRunning = false
    }

    updateSpeedDisplay() {
        const speedMultiplierElement = document.getElementById("speed-multiplier")
        if (speedMultiplierElement) {
            speedMultiplierElement.textContent = `x${this.speedMultiplier.toFixed(1)}`
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.canvas.requestFullscreen) {
                this.canvas.requestFullscreen()
            } else if (this.canvas.mozRequestFullScreen) {
                this.canvas.mozRequestFullScreen()
            } else if (this.canvas.webkitRequestFullscreen) {
                this.canvas.webkitRequestFullscreen()
            } else if (this.canvas.msRequestFullscreen) {
                this.canvas.msRequestFullscreen()
            }
            this.canvas.classList.add("fullscreen-canvas")
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen()
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen()
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen()
            }
            this.canvas.classList.remove("fullscreen-canvas")
        }

        // Resize canvas after a short delay to ensure proper dimensions
        setTimeout(() => this.resizeCanvas(), 100)
    }
}

// Export game class
window.ClashAndConquer = ClashAndConquer