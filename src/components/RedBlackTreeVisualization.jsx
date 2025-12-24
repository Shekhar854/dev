import React, { useState, useEffect } from 'react';

const RedBlackTree = () => {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  
  const RED = 'red';
  const BLACK = 'black';
  
  class RBNode {
    constructor(value) {
      this.value = value;
      this.color = RED;
      this.left = null;
      this.right = null;
      this.parent = null;
    }
  }
  
  class RBTree {
    constructor() {
      this.root = null;
    }
    
    clone() {
      const newTree = new RBTree();
      newTree.root = this.cloneNode(this.root);
      return newTree;
    }
    
    cloneNode(node, parent = null) {
      if (!node) return null;
      const newNode = new RBNode(node.value);
      newNode.color = node.color;
      newNode.parent = parent;
      newNode.left = this.cloneNode(node.left, newNode);
      newNode.right = this.cloneNode(node.right, newNode);
      return newNode;
    }
    
    rotateLeft(node) {
      const right = node.right;
      node.right = right.left;
      if (right.left) right.left.parent = node;
      right.parent = node.parent;
      if (!node.parent) this.root = right;
      else if (node === node.parent.left) node.parent.left = right;
      else node.parent.right = right;
      right.left = node;
      node.parent = right;
    }
    
    rotateRight(node) {
      const left = node.left;
      node.left = left.right;
      if (left.right) left.right.parent = node;
      left.parent = node.parent;
      if (!node.parent) this.root = left;
      else if (node === node.parent.right) node.parent.right = left;
      else node.parent.left = left;
      left.right = node;
      node.parent = left;
    }
    
    insert(value) {
      const node = new RBNode(value);
      const steps = [];
      
      if (!this.root) {
        this.root = node;
        this.root.color = BLACK;
        steps.push({
          action: 'insert_root',
          value,
          description: `Insert ${value} as root (colored BLACK by property)`,
          explanation: 'The root of a Red-Black Tree must always be BLACK. This is the first node, so it becomes the root.',
          highlightNodes: [value]
        });
        return steps;
      }
      
      let current = this.root;
      let parent = null;
      
      steps.push({
        action: 'search',
        value,
        description: `Search for insertion position for ${value}`,
        explanation: `Starting from root, traverse the tree to find where ${value} should be inserted. Go left if ${value} is smaller, right if larger.`,
        highlightNodes: [this.root.value]
      });
      
      while (current) {
        parent = current;
        if (value < current.value) {
          current = current.left;
          steps.push({
            action: 'traverse_left',
            value,
            description: `${value} < ${parent.value}, go left`,
            explanation: `Since ${value} is less than ${parent.value}, we move to the left child to maintain BST property.`,
            highlightNodes: [parent.value]
          });
        } else if (value > current.value) {
          current = current.right;
          steps.push({
            action: 'traverse_right',
            value,
            description: `${value} > ${parent.value}, go right`,
            explanation: `Since ${value} is greater than ${parent.value}, we move to the right child to maintain BST property.`,
            highlightNodes: [parent.value]
          });
        } else {
          steps.push({
            action: 'duplicate',
            value,
            description: `${value} already exists, skip insertion`,
            explanation: 'Red-Black Trees do not allow duplicate values.',
            highlightNodes: [value]
          });
          return steps;
        }
      }
      
      node.parent = parent;
      if (value < parent.value) {
        parent.left = node;
        steps.push({
          action: 'insert_left',
          value,
          description: `Insert ${value} as RED left child of ${parent.value}`,
          explanation: `New nodes are always inserted as RED. We insert ${value} as the left child because it's smaller than ${parent.value}.`,
          highlightNodes: [value, parent.value]
        });
      } else {
        parent.right = node;
        steps.push({
          action: 'insert_right',
          value,
          description: `Insert ${value} as RED right child of ${parent.value}`,
          explanation: `New nodes are always inserted as RED. We insert ${value} as the right child because it's larger than ${parent.value}.`,
          highlightNodes: [value, parent.value]
        });
      }
      
      const fixSteps = this.fixInsertSteps(node);
      steps.push(...fixSteps);
      
      return steps;
    }
    
    fixInsertSteps(node) {
      const steps = [];
      
      while (node !== this.root && node.parent.color === RED) {
        if (node.parent === node.parent.parent.left) {
          const uncle = node.parent.parent.right;
          
          if (uncle && uncle.color === RED) {
            steps.push({
              action: 'recolor_case1',
              value: node.value,
              description: `Case 1: Uncle is RED - Recolor parent, uncle, and grandparent`,
              explanation: `Parent and uncle are both RED. Solution: Change parent and uncle to BLACK, grandparent to RED. This maintains black height while fixing the red-red violation.`,
              highlightNodes: [node.value, node.parent.value, uncle.value, node.parent.parent.value]
            });
            node.parent.color = BLACK;
            uncle.color = BLACK;
            node.parent.parent.color = RED;
            node = node.parent.parent;
          } else {
            if (node === node.parent.right) {
              steps.push({
                action: 'rotate_left',
                value: node.value,
                description: `Case 2: Node is right child - Rotate left at parent`,
                explanation: `Node is the right child and uncle is BLACK. First, perform a left rotation at the parent to convert to Case 3.`,
                highlightNodes: [node.value, node.parent.value]
              });
              node = node.parent;
              this.rotateLeft(node);
            }
            steps.push({
              action: 'rotate_right_recolor',
              value: node.value,
              description: `Case 3: Rotate right at grandparent and recolor`,
              explanation: `Uncle is BLACK and node is left child. Rotate right at grandparent and swap colors of parent and grandparent. This fixes the red-red violation.`,
              highlightNodes: [node.value, node.parent.value, node.parent.parent.value]
            });
            node.parent.color = BLACK;
            node.parent.parent.color = RED;
            this.rotateRight(node.parent.parent);
          }
        } else {
          const uncle = node.parent.parent.left;
          
          if (uncle && uncle.color === RED) {
            steps.push({
              action: 'recolor_case1',
              value: node.value,
              description: `Case 1: Uncle is RED - Recolor parent, uncle, and grandparent`,
              explanation: `Parent and uncle are both RED. Solution: Change parent and uncle to BLACK, grandparent to RED. This maintains black height while fixing the red-red violation.`,
              highlightNodes: [node.value, node.parent.value, uncle.value, node.parent.parent.value]
            });
            node.parent.color = BLACK;
            uncle.color = BLACK;
            node.parent.parent.color = RED;
            node = node.parent.parent;
          } else {
            if (node === node.parent.left) {
              steps.push({
                action: 'rotate_right',
                value: node.value,
                description: `Case 2: Node is left child - Rotate right at parent`,
                explanation: `Node is the left child and uncle is BLACK. First, perform a right rotation at the parent to convert to Case 3.`,
                highlightNodes: [node.value, node.parent.value]
              });
              node = node.parent;
              this.rotateRight(node);
            }
            steps.push({
              action: 'rotate_left_recolor',
              value: node.value,
              description: `Case 3: Rotate left at grandparent and recolor`,
              explanation: `Uncle is BLACK and node is right child. Rotate left at grandparent and swap colors of parent and grandparent. This fixes the red-red violation.`,
              highlightNodes: [node.value, node.parent.value, node.parent.parent.value]
            });
            node.parent.color = BLACK;
            node.parent.parent.color = RED;
            this.rotateLeft(node.parent.parent);
          }
        }
      }
      
      if (this.root.color === RED) {
        steps.push({
          action: 'root_black',
          value: this.root.value,
          description: `Ensure root is BLACK`,
          explanation: `After rebalancing, we must ensure the root remains BLACK as per Red-Black Tree property 2.`,
          highlightNodes: [this.root.value]
        });
        this.root.color = BLACK;
      }
      
      return steps;
    }
  }
  
  const handleInsert = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    
    setIsAnimating(true);
    const currentTree = history.length > 0 ? history[history.length - 1].tree : new RBTree();
    const newTree = currentTree.clone();
    const steps = newTree.insert(value);
    
    const newHistory = [...history];
    steps.forEach(step => {
      newHistory.push({
        value,
        tree: newTree.clone(),
        step
      });
    });
    
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setInputValue('');
    
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  const handleBulkInsert = () => {
    const values = inputValue.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) return;
    
    let tree = new RBTree();
    const newHistory = [];
    
    values.forEach(value => {
      const steps = tree.insert(value);
      steps.forEach(step => {
        newHistory.push({
          value,
          tree: tree.clone(),
          step
        });
      });
    });
    
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setInputValue('');
  };
  
  const handleReset = () => {
    setHistory([]);
    setCurrentStep(0);
    setInputValue('');
    setHighlightedNodes(new Set());
  };
  
  useEffect(() => {
    if (currentStep >= 0 && history[currentStep]) {
      setHighlightedNodes(new Set(history[currentStep].step.highlightNodes || []));
    }
  }, [currentStep, history]);
  
  const Node = ({ node, x, y, level, highlight }) => {
    if (!node) return null;
    
    const horizontalGap = Math.max(50, 350 / Math.pow(2, level));
    const verticalGap = 90;
    
    const leftX = x - horizontalGap;
    const leftY = y + verticalGap;
    const rightX = x + horizontalGap;
    const rightY = y + verticalGap;
    
    const isHighlighted = highlightedNodes.has(node.value);
    
    return (
      <g className="transition-all duration-500 ease-in-out">
        {node.left && (
          <>
            <line 
              x1={x} y1={y + 28} 
              x2={leftX} y2={leftY - 28} 
              stroke="#94a3b8" 
              strokeWidth="3"
              className="transition-all duration-500"
            />
            <Node node={node.left} x={leftX} y={leftY} level={level + 1} />
          </>
        )}
        {node.right && (
          <>
            <line 
              x1={x} y1={y + 28} 
              x2={rightX} y2={rightY - 28} 
              stroke="#94a3b8" 
              strokeWidth="3"
              className="transition-all duration-500"
            />
            <Node node={node.right} x={rightX} y={rightY} level={level + 1} />
          </>
        )}
        
        <g className={`transition-all duration-500 ${isAnimating ? 'animate-bounce' : ''}`}>
          {isHighlighted && (
            <>
              <circle 
                cx={x} cy={y} r="38" 
                fill="none"
                stroke="#fbbf24"
                strokeWidth="4"
                className="animate-pulse"
              />
              <circle 
                cx={x} cy={y} r="34" 
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.5"
                className="animate-ping"
              />
            </>
          )}
          
          <circle 
            cx={x} cy={y} r="28" 
            fill={node.color === RED ? '#ef4444' : '#1f2937'}
            stroke={isHighlighted ? '#fbbf24' : '#ffffff'}
            strokeWidth={isHighlighted ? '4' : '3'}
            className="transition-all duration-300"
            style={{
              filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
            }}
          />
          
          {node.color === RED && (
            <circle 
              cx={x} cy={y} r="28" 
              fill="url(#redGradient)"
              opacity="0.3"
            />
          )}
          
          <text 
            x={x} y={y} 
            textAnchor="middle" 
            dy="0.35em" 
            fill="white" 
            fontSize="18" 
            fontWeight="bold"
            className="transition-all duration-300"
          >
            {node.value}
          </text>
        </g>
      </g>
    );
  };
  
  const currentTree = currentStep >= 0 && history[currentStep] ? history[currentStep].tree : null;
  const currentStepInfo = currentStep >= 0 && history[currentStep] ? history[currentStep].step : null;
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
            🎨 Red-Black Tree Visualizer
          </h1>
          <p className="text-gray-300 text-lg">
            Interactive step-by-step visualization with detailed explanations
          </p>
        </div>
        
        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">🔢</span>
                Enter Value(s)
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
                placeholder="e.g., 42 or 4,7,12,15,3"
                className="w-full px-5 py-3 bg-white/90 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none text-lg transition-all"
              />
            </div>
            <button
              onClick={handleInsert}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              ➕ Insert One
            </button>
            <button
              onClick={handleBulkInsert}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              📥 Insert All
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              🔄 Reset
            </button>
          </div>
        </div>
        
        {/* Step Navigation */}
        {history.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 disabled:bg-white/5 disabled:cursor-not-allowed transition-all font-semibold backdrop-blur"
              >
                ← Previous
              </button>
              <div className="text-center">
                <p className="font-bold text-white text-xl mb-1">
                  Step {currentStep + 1} of {history.length}
                </p>
                <p className="text-purple-200 text-sm">
                  Inserting: {history[currentStep].value}
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(Math.min(history.length - 1, currentStep + 1))}
                disabled={currentStep === history.length - 1}
                className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 disabled:bg-white/5 disabled:cursor-not-allowed transition-all font-semibold backdrop-blur"
              >
                Next →
              </button>
            </div>
            <input
              type="range"
              min="0"
              max={history.length - 1}
              value={currentStep}
              onChange={(e) => setCurrentStep(parseInt(e.target.value))}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}
        
        {/* Step Explanation */}
        {currentStepInfo && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-blue-300/30">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {currentStepInfo.description}
                </h3>
                <p className="text-gray-200 leading-relaxed text-base">
                  {currentStepInfo.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tree Visualization */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6 border border-white/20 overflow-x-auto">
          {currentTree && currentTree.root ? (
            <svg width="900" height="600" className="mx-auto">
              <defs>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <Node node={currentTree.root} x={450} y={50} level={1} />
            </svg>
          ) : (
            <div className="text-center text-white/60 py-32">
              <div className="text-6xl mb-4">🌳</div>
              <p className="text-2xl font-semibold mb-2">Empty Tree</p>
              <p className="text-lg">Start by inserting values above</p>
            </div>
          )}
        </div>
        
        {/* Legend & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Legend
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 border-2 border-white shadow-lg"></div>
                <span className="text-white font-semibold">Red Node</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-white shadow-lg"></div>
                <span className="text-white font-semibold">Black Node</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 border-4 border-yellow-400 shadow-lg"></div>
                <span className="text-white font-semibold">Highlighted Node</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              RB-Tree Properties
            </h3>
            <ul className="space-y-2 text-white/90 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Every node is RED or BLACK</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Root is always BLACK</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>All leaves (NIL) are BLACK</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>RED nodes have BLACK children</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>All paths have same BLACK height</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Insertion History */}
        {history.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mt-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Insertion History
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(history.map(h => h.value))).map((val, i) => (
                <div
                  key={i}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg"
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .animate-bounce {
          animation: bounce 0.5s ease-in-out;
        }
        
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default RedBlackTree;