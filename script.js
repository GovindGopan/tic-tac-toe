document.addEventListener('DOMContentLoaded', () => {
    const DOMElements = {
        board: document.querySelector('.board'),
        cells: document.querySelectorAll('.cell'),
        modeButtons: {
            pvp: document.getElementById('pvpButton'),
            pva: document.getElementById('pvaButton'),
        },
        gameStatus: document.querySelector('.game-status'),
        playerTurn: document.querySelector('.player-turn'),
        scores: {
            playerX: document.getElementById('playerXScore'),
            playerO: document.getElementById('playerOScore'),
            tie: document.getElementById('tieScore'),
        },
        resetButton: document.getElementById('resetButton'),
        themeToggle: document.getElementById('theme-toggle'),
        themeIcon: document.querySelector('#theme-toggle i'),
    };

    const state = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameMode: 'PVA', // PVP or PVA
        isActive: true,
        scores: { X: 0, O: 0, tie: 0 },
    };

    const WINNING_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const init = () => {
        setupEventListeners();
        resetGame();
        // Set initial theme based on user's system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            DOMElements.themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    };

    const setupEventListeners = () => {
        DOMElements.cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        DOMElements.resetButton.addEventListener('click', resetGame);
        DOMElements.themeToggle.addEventListener('click', toggleTheme);
        DOMElements.modeButtons.pvp.addEventListener('click', () => setGameMode('PVP'));
        DOMElements.modeButtons.pva.addEventListener('click', () => setGameMode('PVA'));
    };

    const setGameMode = (mode) => {
        state.gameMode = mode;
        DOMElements.modeButtons.pvp.classList.toggle('active', mode === 'PVP');
        DOMElements.modeButtons.pva.classList.toggle('active', mode === 'PVA');
        resetGame();
    };

    const handleCellClick = (e) => {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);

        if (state.board[index] !== '' || !state.isActive) {
            return;
        }

        makeMove(index, state.currentPlayer);

        if (!state.isActive) return;

        if (state.gameMode === 'PVA' && state.currentPlayer === 'O' && state.isActive) {
            DOMElements.board.classList.add('thinking');
            setTimeout(makeAIMove, 500);
        }
    };

    const makeMove = (index, player) => {
        if (!state.isActive || state.board[index] !== '') return;

        state.board[index] = player;
        renderBoard();

        const winner = checkWinner();
        if (winner) {
            endGame(winner);
        } else {
            swapTurns();
        }
    };

    const swapTurns = () => {
        state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
        updateTurnIndicator();
    };

    const checkWinner = () => {
        for (const combination of WINNING_COMBINATIONS) {
            const [a, b, c] = combination;
            if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
                return { player: state.board[a], combination };
            }
        }
        if (!state.board.includes('')) {
            return { player: 'tie' };
        }
        return null;
    };

    const makeAIMove = () => {
        DOMElements.board.classList.add('thinking');
        setTimeout(() => {
            const bestMove = findBestMove();
            if (bestMove !== null) {
                makeMove(bestMove, 'O');
            }
            DOMElements.board.classList.remove('thinking');
        }, 500);
    };

    const findBestMove = () => {
        let bestVal = -Infinity;
        let bestMove = null;

        for (let i = 0; i < 9; i++) {
            if (state.board[i] === '') {
                state.board[i] = 'O';
                let moveVal = minimax(0, false);
                state.board[i] = ''; // Undo move
                if (moveVal > bestVal) {
                    bestMove = i;
                    bestVal = moveVal;
                }
            }
        }
        return bestMove;
    };

    const minimax = (depth, isMaximizing) => {
        const winner = checkWinner();
        if (winner) {
            if (winner.player === 'O') return 10 - depth;
            if (winner.player === 'X') return depth - 10;
            if (winner.player === 'tie') return 0;
        }

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (state.board[i] === '') {
                    state.board[i] = 'O';
                    best = Math.max(best, minimax(depth + 1, !isMaximizing));
                    state.board[i] = '';
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (state.board[i] === '') {
                    state.board[i] = 'X';
                    best = Math.min(best, minimax(depth + 1, !isMaximizing));
                    state.board[i] = '';
                }
            }
            return best;
        }
    };

    const endGame = (winner) => {
        state.isActive = false;
        if (winner.player === 'tie') {
            state.scores.tie++;
            updateStatus('It\'s a Draw!', 'status-draw');
        } else {
            state.scores[winner.player]++;
            updateStatus(`${winner.player} Wins!`, 'status-win');
            highlightWinningCells(winner.combination);
        }
        updateScores();
    };

    const resetGame = () => {
        state.board.fill('');
        state.currentPlayer = 'X';
        state.isActive = true;
        renderBoard();
        updateTurnIndicator();
        updateScores();
        updateStatus('');
        DOMElements.cells.forEach(cell => cell.classList.remove('winning-cell'));
    };

    // --- Render Functions ---
    const renderBoard = () => {
        state.board.forEach((value, index) => {
            const cell = DOMElements.cells[index];
            cell.textContent = value;
            cell.className = 'cell'; // Reset classes
            if (value) cell.classList.add(value.toLowerCase());
        });
    };

    const updateScores = () => {
        DOMElements.scores.playerX.textContent = state.scores.X;
        DOMElements.scores.playerO.textContent = state.scores.O;
        DOMElements.scores.tie.textContent = state.scores.tie;
    };

    const updateStatus = (message, className = '') => {
        DOMElements.gameStatus.textContent = message;
        DOMElements.gameStatus.className = `game-status ${className}`;
    };

    const updateTurnIndicator = () => {
        DOMElements.playerTurn.textContent = state.isActive ? `${state.currentPlayer}'s Turn` : '';
    };

    const highlightWinningCells = (combination) => {
        combination.forEach(index => {
            DOMElements.cells[index].classList.add('winning-cell');
        });
    };

    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        DOMElements.themeIcon.classList.toggle('fa-sun', isDarkMode);
        DOMElements.themeIcon.classList.toggle('fa-moon', !isDarkMode);
    };

    init();
});