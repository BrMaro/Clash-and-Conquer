/**
 * Clash & Conquer - UI Interactions
 * Handles UI events and theme toggling
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize game
    const game = new ClashAndConquer("game-canvas")
    window.ClashAndConquerInstance = game // Make game instance globally accessible
    let selectedType = null
    let entityCount = 20
    let morphLosers = true

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle")
    themeToggle.addEventListener("click", toggleTheme)

    // Check for saved theme preference
    if (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
        document.body.classList.add("dark")
    }

    // Entity count slider
    const entityCountSlider = document.getElementById("entity-count")
    const entityCountValue = document.getElementById("entity-count-value")

    entityCountSlider.addEventListener("input", () => {
        entityCount = Number.parseInt(entityCountSlider.value)
        entityCountValue.textContent = entityCount
    })

    // Collision behavior radio buttons
    const collisionBehaviorRadios = document.querySelectorAll('input[name="collision-behavior"]')
    collisionBehaviorRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
            morphLosers = radio.value === "disappear"
        })
    })
    console.log(morphLosers)
    // Selection buttons
    const selectionButtons = document.querySelectorAll(".selection-btn")
    selectionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove selected class from all buttons
            selectionButtons.forEach((btn) => btn.classList.remove("selected"))

            // Add selected class to clicked button
            button.classList.add("selected")

            // Store selected type
            selectedType = button.getAttribute("data-type")
        })
    })

    // Start game button
    // Start game button
    const startGameButton = document.getElementById("start-game")
    startGameButton.addEventListener("click", () => {
        // Check if any ambiguity needs to be resolved
        if (!selectedType) {
            if (!confirm("You haven't selected an element to root for. Continue anyway?")) {
                return
            }
        }

        document.getElementById("pre-selection").style.display = "none"
        document.getElementById("game-container").style.display = "block"
        document.getElementById("victory-message").style.display = "none"

        // Ensure the canvas is properly resized now that it is visible
        game.resizeCanvas()

        // Initialize game with selected options
        game.init(selectedType, entityCount, morphLosers)
    })

    // Speed up button
    const speedUpButton = document.getElementById("speed-up")
    speedUpButton.addEventListener("click", () => {
        game.speedUp()
    })

    // Fullscreen button
    const fullscreenButton = document.getElementById("fullscreen")
    fullscreenButton.addEventListener("click", () => {
        game.toggleFullscreen()
    })

    // Reset game button
    const resetGameButton = document.getElementById("reset-game")
    resetGameButton.addEventListener("click", () => {
        document.getElementById("victory-message").style.display = "none"
        game.init(selectedType, entityCount, morphLosers)
    })

    // Play again button
    const playAgainButton = document.getElementById("play-again")
    playAgainButton.addEventListener("click", () => {
        document.getElementById("pre-selection").style.display = "block"
        document.getElementById("game-container").style.display = "none"
        document.getElementById("victory-message").style.display = "none"

        // Reset selection
        selectionButtons.forEach((btn) => btn.classList.remove("selected"))
        selectedType = null
    })

    // Handle fullscreen change events
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    function handleFullscreenChange() {
        if (
            !document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement
        ) {
            game.canvas.classList.remove("fullscreen-canvas")
            game.resizeCanvas()
        }
    }

    // Make canvas responsive to window resize
    window.addEventListener("resize", () => {
        if (game) {
            game.resizeCanvas()
        }
    })

    // Handle touch events for mobile
    setupTouchEvents()
})

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark")
        localStorage.setItem("theme", "light")
    } else {
        document.body.classList.add("dark")
        localStorage.setItem("theme", "dark")
    }
}

/**
 * Setup touch events for mobile devices
 */
function setupTouchEvents() {
    const canvas = document.getElementById("game-canvas")

    // Prevent scrolling when touching the canvas
    canvas.addEventListener(
        "touchstart",
        (e) => {
            if (e.target === canvas) {
                e.preventDefault()
            }
        },
        { passive: false },
    )

    canvas.addEventListener(
        "touchmove",
        (e) => {
            if (e.target === canvas) {
                e.preventDefault()
            }
        },
        { passive: false },
    )

    // Add double tap to speed up on mobile
    let lastTap = 0
    canvas.addEventListener("touchend", (e) => {
        const currentTime = new Date().getTime()
        const tapLength = currentTime - lastTap

        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            if (window.ClashAndConquerInstance) {
                window.ClashAndConquerInstance.speedUp()
            }
            e.preventDefault()
        }

        lastTap = currentTime
    })
}

// Back to menu button
const backToMenuButton = document.getElementById("back-to-menu")
backToMenuButton.addEventListener("click", () => {
    // Stop the game (if you want to halt the game loop)
    if (window.ClashAndConquerInstance) {
        window.ClashAndConquerInstance.stop();
    }

    // Hide the game container and victory message, then show the pre-selection menu
    document.getElementById("game-container").style.display = "none"
    document.getElementById("victory-message").style.display = "none"
    document.getElementById("pre-selection").style.display = "block"

    // Optionally, reset any selection buttons (if needed)
    const selectionButtons = document.querySelectorAll(".selection-btn")
    selectionButtons.forEach((btn) => btn.classList.remove("selected"))
})
