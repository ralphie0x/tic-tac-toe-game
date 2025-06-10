import React, { useState, useEffect, useCallback } from 'react';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(81).fill(null)); // 9x9 = 81 cells
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [gameMode, setGameMode] = useState('human-human');
  const [aiLevel, setAiLevel] = useState(1);
  const [gameStatus, setGameStatus] = useState('playing');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showAiLevelSelect, setShowAiLevelSelect] = useState(false);

  const checkWinner = useCallback((board) => {
    const size = 9; // Changed from 6 to 9
    const winLength = 7; // Changed from 4 to 7
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        if (!board[index]) continue;
        
        const player = board[index];
        
        // Check horizontal
        if (col <= size - winLength) {
          let count = 0;
          for (let i = 0; i < winLength; i++) {
            if (board[row * size + col + i] === player) count++;
          }
          if (count === winLength) return player;
        }
        
        // Check vertical
        if (row <= size - winLength) {
          let count = 0;
          for (let i = 0; i < winLength; i++) {
            if (board[(row + i) * size + col] === player) count++;
          }
          if (count === winLength) return player;
        }
        
        // Check diagonal (top-left to bottom-right)
        if (row <= size - winLength && col <= size - winLength) {
          let count = 0;
          for (let i = 0; i < winLength; i++) {
            if (board[(row + i) * size + col + i] === player) count++;
          }
          if (count === winLength) return player;
        }
        
        // Check diagonal (top-right to bottom-left)
        if (row <= size - winLength && col >= winLength - 1) {
          let count = 0;
          for (let i = 0; i < winLength; i++) {
            if (board[(row + i) * size + col - i] === player) count++;
          }
          if (count === winLength) return player;
        }
      }
    }
    return null;
  }, []);

  const findBlockingMove = useCallback((board, player) => {
    const opponent = player === 'white' ? 'black' : 'white';
    const size = 9; // Changed from 6 to 9

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        if (board[index] !== null) continue;

        board[index] = player;
        if (checkWinner(board) === player) {
          board[index] = null;
          return index;
        }
        board[index] = null;

        board[index] = opponent;
        if (checkWinner(board) === opponent) {
          board[index] = null;
          return index;
        }
        board[index] = null;
      }
    }

    return null;
  }, [checkWinner]);

  const minimax = useCallback((board, depth, isMaximizing, player, maxDepth = 2) => {
    const opponent = player === 'white' ? 'black' : 'white';
    const winner = checkWinner(board);
    
    if (winner === player) return 10 - depth;
    if (winner === opponent) return depth - 10;
    if (board.every(cell => cell !== null) || depth >= maxDepth) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 81; i++) { // Changed from 36 to 81
        if (board[i] === null) {
          board[i] = player;
          const score = minimax(board, depth + 1, false, player, maxDepth);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 81; i++) { // Changed from 36 to 81
        if (board[i] === null) {
          board[i] = opponent;
          const score = minimax(board, depth + 1, true, player, maxDepth);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [checkWinner]);

  const findBestMove = useCallback((board, player) => {
    let bestScore = -Infinity;
    let bestMove = 0;
    
    const immediateMove = findBlockingMove(board, player);
    if (immediateMove !== null) return immediateMove;
    
    for (let i = 0; i < 81; i++) { // Changed from 36 to 81
      if (board[i] === null) {
        board[i] = player;
        const score = minimax(board, 0, false, player, 1); // Reduced depth for 9x9
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }, [findBlockingMove, minimax]);

  const makeAIMove = useCallback((currentBoard, player, level) => {
    const availableMoves = currentBoard
      .map((cell, index) => cell === null ? index : null)
      .filter(val => val !== null);
    
    if (availableMoves.length === 0) return currentBoard;
    
    let moveIndex;
    
    if (level === 1) {
      moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else if (level === 2) {
      moveIndex = findBlockingMove(currentBoard, player) || 
                  availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      moveIndex = findBestMove(currentBoard, player);
    }
    
    const newBoard = [...currentBoard];
    newBoard[moveIndex] = player;
    return newBoard;
  }, [findBlockingMove, findBestMove]);

  const handleCellClick = (index) => {
    if (gameStatus !== 'playing' || board[index] !== null) return;
    
    if (gameMode === 'ai-ai') return;
    if (gameMode === 'human-ai' && !isWhiteTurn) return;

    const newBoard = [...board];
    newBoard[index] = isWhiteTurn ? 'white' : 'black';
    setBoard(newBoard);
    setIsWhiteTurn(!isWhiteTurn);
  };

  useEffect(() => {
    if (!isGameStarted) return;

    const winner = checkWinner(board);
    if (winner) {
      setGameStatus(winner === 'white' ? 'white-wins' : 'black-wins');
      return;
    }

    if (board.every(cell => cell !== null)) {
      setGameStatus('draw');
      return;
    }

    if (gameMode === 'human-ai' && !isWhiteTurn && gameStatus === 'playing') {
      setTimeout(() => {
        const newBoard = makeAIMove(board, 'black', aiLevel);
        setBoard(newBoard);
        setIsWhiteTurn(true);
      }, 500);
    } else if (gameMode === 'ai-ai' && gameStatus === 'playing') {
      setTimeout(() => {
        const currentPlayer = isWhiteTurn ? 'white' : 'black';
        const level = aiLevel;
        const newBoard = makeAIMove(board, currentPlayer, level);
        setBoard(newBoard);
        setIsWhiteTurn(!isWhiteTurn);
      }, 1000);
    }
  }, [board, isWhiteTurn, gameMode, gameStatus, isGameStarted, aiLevel, makeAIMove, checkWinner]);

  const startGame = (mode) => {
    if (mode === 'human-ai' || mode === 'ai-ai') {
      setGameMode(mode);
      setShowAiLevelSelect(true);
    } else {
      setGameMode(mode);
      setBoard(Array(81).fill(null)); // Changed from 36 to 81
      setIsWhiteTurn(true);
      setGameStatus('playing');
      setIsGameStarted(true);
    }
  };

  const startGameWithAI = (level) => {
    setAiLevel(level);
    setBoard(Array(81).fill(null)); // Changed from 36 to 81
    setIsWhiteTurn(true);
    setGameStatus('playing');
    setIsGameStarted(true);
    setShowAiLevelSelect(false);
  };

  const resetGame = () => {
    setBoard(Array(81).fill(null)); // Changed from 36 to 81
    setIsWhiteTurn(true);
    setGameStatus('playing');
  };

  const backToMenu = () => {
    setIsGameStarted(false);
    setShowAiLevelSelect(false);
    setBoard(Array(81).fill(null)); // Changed from 36 to 81
    setIsWhiteTurn(true);
    setGameStatus('playing');
  };

  if (!isGameStarted && !showAiLevelSelect) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #1e3a8a, #581c87)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1f2937',
            marginBottom: '2rem'
          }}>
            9x9 Tic-Tac-Toe
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={() => startGame('human-human')}
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: '600',
                padding: '1rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.125rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              Human vs Human
            </button>
            <button
              onClick={() => startGame('human-ai')}
              style={{
                width: '100%',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: '600',
                padding: '1rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.125rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Human vs AI
            </button>
            <button
              onClick={() => startGame('ai-ai')}
              style={{
                width: '100%',
                backgroundColor: '#8b5cf6',
                color: 'white',
                fontWeight: '600',
                padding: '1rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.125rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              AI vs AI
            </button>
          </div>
          <div style={{ marginTop: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '0.875rem' }}>White goes first</p>
            <p style={{ fontSize: '0.875rem' }}>Get seven in a row to win!</p>
          </div>
        </div>
      </div>
    );
  }

  if (showAiLevelSelect) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #1e3a8a, #581c87)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Select AI Difficulty
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '2rem'
          }}>
            {gameMode === 'human-ai' ? 'Choose your opponent\'s skill level' : 'Choose AI skill level for both players'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { level: 1, color: '#10b981', hoverColor: '#059669', title: 'Level 1 - Easy', desc: 'Random moves, great for beginners' },
              { level: 2, color: '#f59e0b', hoverColor: '#d97706', title: 'Level 2 - Medium', desc: 'Smart blocking moves, good challenge' },
              { level: 3, color: '#ef4444', hoverColor: '#dc2626', title: 'Level 3 - Hard', desc: 'Strategic play, tough opponent!' }
            ].map(({ level, color, hoverColor, title, desc }) => (
              <button
                key={level}
                onClick={() => startGameWithAI(level)}
                style={{
                  width: '100%',
                  backgroundColor: color,
                  color: 'white',
                  fontWeight: '600',
                  padding: '1rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = hoverColor}
                onMouseOut={(e) => e.target.style.backgroundColor = color}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{title}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAiLevelSelect(false)}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #1e3a8a, #581c87)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '2rem',
        maxWidth: '40rem', // Increased max width for larger board
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            9x9 Tic-Tac-Toe
          </h1>
          <div style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            {gameMode === 'human-human' && 'Human vs Human'}
            {gameMode === 'human-ai' && `Human vs AI (Level ${aiLevel})`}
            {gameMode === 'ai-ai' && `AI vs AI (Level ${aiLevel})`}
          </div>
          
          {gameStatus === 'playing' && (
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              Current Turn: <span style={{ color: isWhiteTurn ? '#374151' : '#1f2937' }}>
                {isWhiteTurn ? 'White' : 'Black'}
              </span>
            </div>
          )}
          
          {gameStatus === 'white-wins' && (
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>White Wins! 🎉</div>
          )}
          
          {gameStatus === 'black-wins' && (
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>Black Wins! 🎉</div>
          )}
          
          {gameStatus === 'draw' && (
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>It's a Draw! 🤝</div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)', // Changed from 6 to 9
          gap: '0.15rem', // Reduced gap for larger board
          marginBottom: '1.5rem',
          maxWidth: '32rem', // Increased max width
          margin: '0 auto 1.5rem auto'
        }}>
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              style={{
                aspectRatio: '1',
                width: '100%',
                border: cell === 'white' ? '1px solid #9ca3af' : cell === 'black' ? '1px solid #374151' : '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem', // Reduced font size for smaller cells
                fontWeight: 'bold',
                backgroundColor: cell === 'white' ? 'white' : cell === 'black' ? '#1f2937' : '#f3f4f6',
                color: cell === 'white' ? '#1f2937' : cell === 'black' ? 'white' : '#1f2937',
                cursor: gameStatus !== 'playing' || cell !== null ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              disabled={gameStatus !== 'playing' || cell !== null}
              onMouseOver={(e) => {
                if (gameStatus === 'playing' && !cell) {
                  e.target.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseOut={(e) => {
                if (!cell) {
                  e.target.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              {cell === 'white' && '○'}
              {cell === 'black' && '●'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={resetGame}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#d97706'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f59e0b'}
          >
            Reset Game
          </button>
          <button
            onClick={backToMenu}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;