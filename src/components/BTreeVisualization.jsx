import React, { useState } from 'react';

const BTreeVisualization = () => {
  const [minDegree, setMinDegree] = useState(3);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  
  class BTreeNode {
    constructor(isLeaf = true) {
      this.keys = [];
      this.children = [];
      this.isLeaf = isLeaf;
    }
  }
  
  class BTree {
    constructor(t) {
      this.root = new BTreeNode(true);
      this.t = t;
      this.maxKeys = 2 * t - 1;
      this.minKeys = t - 1;
    }
    
    clone() {
      const newTree = new BTree(this.t);
      newTree.root = this.cloneNode(this.root);
      return newTree;
    }
    
    cloneNode(node) {
      if (!node) return null;
      const newNode = new BTreeNode(node.isLeaf);
      newNode.keys = [...node.keys];
      newNode.children = node.children.map(child => this.cloneNode(child));
      return newNode;
    }
    
    search(key, node = this.root) {
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      if (i < node.keys.length && key === node.keys[i]) return true;
      if (node.isLeaf) return false;
      return this.search(key, node.children[i]);
    }
    
    insert(key) {
      if (this.search(key)) return { success: false, reason: 'Duplicate key' };
      
      const root = this.root;
      if (root.keys.length === this.maxKeys) {
        const newRoot = new BTreeNode(false);
        newRoot.children.push(this.root);
        this.splitChild(newRoot, 0);
        this.root = newRoot;
        this.insertNonFull(newRoot, key);
        return { success: true, reason: 'Root was full - split required, created new root' };
      } else {
        this.insertNonFull(root, key);
        return { success: true, reason: 'Inserted without split' };
      }
    }
    
    insertNonFull(node, key) {
      let i = node.keys.length - 1;
      
      if (node.isLeaf) {
        node.keys.push(0);
        while (i >= 0 && key < node.keys[i]) {
          node.keys[i + 1] = node.keys[i];
          i--;
        }
        node.keys[i + 1] = key;
      } else {
        while (i >= 0 && key < node.keys[i]) i--;
        i++;
        
        if (node.children[i].keys.length === this.maxKeys) {
          this.splitChild(node, i);
          if (key > node.keys[i]) i++;
        }
        this.insertNonFull(node.children[i], key);
      }
    }
    
    splitChild(parent, index) {
      const t = this.t;
      const fullChild = parent.children[index];
      const newChild = new BTreeNode(fullChild.isLeaf);
      
      newChild.keys = fullChild.keys.splice(t);
      const midKey = fullChild.keys.pop();
      
      if (!fullChild.isLeaf) {
        newChild.children = fullChild.children.splice(t);
      }
      
      parent.keys.splice(index, 0, midKey);
      parent.children.splice(index + 1, 0, newChild);
    }
    
    getHeight(node = this.root) {
      if (!node || node.isLeaf) return 1;
      return 1 + this.getHeight(node.children[0]);
    }
    
    getWidth(node = this.root) {
      if (!node) return 0;
      if (node.isLeaf) return 1;
      return node.children.reduce((sum, child) => sum + this.getWidth(child), 0);
    }
  }
  
  const handleInsert = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    
    const currentTree = currentStep >= 0 ? history[currentStep].tree : new BTree(minDegree);
    const newTree = currentTree.clone();
    const result = newTree.insert(value);
    
    if (result.success) {
      const newHistory = history.slice(0, currentStep + 1);
      newHistory.push({
        value,
        tree: newTree,
        description: `Insert ${value}: ${result.reason}`,
        details: generateInsertionDetails(value, currentTree, newTree)
      });
      setHistory(newHistory);
      setCurrentStep(newHistory.length - 1);
    }
    setInputValue('');
  };
  
  const generateInsertionDetails = (value, oldTree, newTree) => {
    const details = [];
    details.push(`• Inserting key ${value} into the B-Tree`);
    
    if (oldTree.root.keys.length === 0) {
      details.push(`• Tree is empty, insert ${value} as root node`);
      details.push(`• Root is a leaf node`);
    } else if (oldTree.root.keys.length === oldTree.maxKeys) {
      details.push(`• Root is full with ${oldTree.maxKeys} keys (maximum allowed)`);
      details.push(`• Split root: middle key ${oldTree.root.keys[Math.floor(oldTree.maxKeys / 2)]} moves up`);
      details.push(`• Create new root with the middle key`);
      details.push(`• Insert ${value} into appropriate child node`);
    } else {
      details.push(`• Root has space (${oldTree.root.keys.length}/${oldTree.maxKeys} keys)`);
      details.push(`• Navigate to appropriate leaf and insert ${value}`);
      if (newTree.root.keys.length > oldTree.root.keys.length) {
        details.push(`• Key inserted directly into root (root is leaf)`);
      } else {
        details.push(`• Key inserted into child node`);
      }
    }
    
    return details;
  };
  
  const handleBulkInsert = () => {
    const values = inputValue.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) return;
    
    let tree = new BTree(minDegree);
    const newHistory = [];
    
    values.forEach(value => {
      const oldTree = tree.clone();
      const result = tree.insert(value);
      if (result.success) {
        newHistory.push({
          value,
          tree: tree.clone(),
          description: `Insert ${value}: ${result.reason}`,
          details: generateInsertionDetails(value, oldTree, tree)
        });
      }
    });
    
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setInputValue('');
  };
  
  const handleReset = () => {
    setHistory([]);
    setCurrentStep(-1);
    setInputValue('');
  };
  
  const handleLoadExample = () => {
    setInputValue('20,30,35,85,10,55,60,25,5,65,70,75,15,40,50,80,45');
  };
  
  const renderNode = (node, x, y, width, positions) => {
    const keyWidth = 50;
    const keyHeight = 45;
    const nodeWidth = node.keys.length * keyWidth;
    const startX = x - nodeWidth / 2;
    
    positions.push({
      node,
      x: startX,
      y,
      width: nodeWidth,
      height: keyHeight
    });
    
    if (!node.isLeaf && node.children.length > 0) {
      const childY = y + 100;
      const totalWidth = width;
      const childSpacing = totalWidth / node.children.length;
      
      node.children.forEach((child, i) => {
        const childX = x - totalWidth / 2 + childSpacing * (i + 0.5);
        const parentConnectX = startX + (i * keyWidth);
        
        positions.push({
          type: 'line',
          x1: parentConnectX + keyWidth / 2,
          y1: y + keyHeight,
          x2: childX,
          y2: childY
        });
        
        renderNode(child, childX, childY, childSpacing * 0.9, positions);
      });
    }
  };
  
  const BTreeView = ({ tree }) => {
    if (!tree || !tree.root || tree.root.keys.length === 0) {
      return (
        <div className="text-center text-gray-500 py-20">
          <p className="text-xl">Empty B-Tree</p>
          <p className="text-sm mt-2">Insert keys to start building the tree</p>
        </div>
      );
    }
    
    const positions = [];
    const treeWidth = Math.min(1200, Math.max(900, tree.getWidth(tree.root) * 200));
    const treeHeight = Math.min(800, tree.getHeight(tree.root) * 120 + 50);
    
    renderNode(tree.root, treeWidth / 2, 30, treeWidth * 0.8, positions);
    
    return (
      <svg width={treeWidth} height={treeHeight} className="mx-auto">
        {positions.map((pos, i) => {
          if (pos.type === 'line') {
            return (
              <line
                key={`line-${i}`}
                x1={pos.x1}
                y1={pos.y1}
                x2={pos.x2}
                y2={pos.y2}
                stroke="#64748b"
                strokeWidth="2"
              />
            );
          }
          
          const { node, x, y, width, height } = pos;
          const keyWidth = 50;
          
          return (
            <g key={`node-${i}`}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="white"
                stroke="#2563eb"
                strokeWidth="2.5"
                rx="6"
              />
              
              {node.keys.map((key, ki) => (
                <g key={`key-${i}-${ki}`}>
                  {ki > 0 && (
                    <line
                      x1={x + ki * keyWidth}
                      y1={y}
                      x2={x + ki * keyWidth}
                      y2={y + height}
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                  )}
                  <text
                    x={x + ki * keyWidth + keyWidth / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#1e40af"
                  >
                    {key}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    );
  };
  
  const currentTree = currentStep >= 0 ? history[currentStep].tree : null;
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Interactive B-Tree Visualization
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Visualize B-Tree insertions step by step with detailed explanations
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Minimum Degree (t): {minDegree}
            </label>
            <input
              type="range"
              min="2"
              max="5"
              value={minDegree}
              onChange={(e) => {
                setMinDegree(parseInt(e.target.value));
                handleReset();
              }}
              className="w-full"
              disabled={history.length > 0}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>t=2</span>
              <span>t=3</span>
              <span>t=4</span>
              <span>t=5</span>
            </div>
            <div className="mt-2 text-sm text-gray-700 bg-white rounded p-3">
              <p><strong>Properties with t={minDegree}:</strong></p>
              <p>• Maximum keys per node: {2 * minDegree - 1}</p>
              <p>• Minimum keys per node (non-root): {minDegree - 1}</p>
              <p>• Maximum children per node: {2 * minDegree}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Enter Key(s)
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
                placeholder="e.g., 42 or 20,30,35,85,10..."
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleInsert}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-md"
            >
              Insert One
            </button>
            <button
              onClick={handleBulkInsert}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition shadow-md"
            >
              Insert All
            </button>
            <button
              onClick={handleLoadExample}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition shadow-md"
            >
              Load Example
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition shadow-md"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
          <p className="font-bold text-gray-800 mb-2">📚 Example Question:</p>
          <p className="text-sm text-gray-700 mb-2">
            "Show the results of inserting the keys 20,30,35,85,10,55,60,25,5,65,70,75,15,40,50,80,45 
            in order into an empty B-tree. Use t=3, where t is the minimum degree of B-tree"
          </p>
          <p className="text-xs text-gray-600">
            Click "Load Example" to automatically load these values, then use "Insert All" to see the solution!
          </p>
        </div>
        
        {history.length > 0 && (
          <>
            <div className="bg-gray-50 rounded-lg p-5 mb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
                >
                  ← Previous
                </button>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-lg">
                    Step {currentStep + 1} of {history.length}
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">
                    {history[currentStep].description}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(Math.min(history.length - 1, currentStep + 1))}
                  disabled={currentStep === history.length - 1}
                  className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
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
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="bg-blue-50 rounded-lg p-5 mb-6 border-2 border-blue-200">
              <p className="font-bold text-gray-800 mb-3 text-lg">🔍 Step Explanation:</p>
              <div className="space-y-1">
                {history[currentStep].details.map((detail, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {detail}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 overflow-x-auto mb-6">
              <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">B-Tree Structure:</h3>
              <BTreeView tree={currentTree} />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200">
                <p className="font-bold text-gray-800 mb-3 text-lg">📝 Insertion History:</p>
                <div className="flex flex-wrap gap-2">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        i === currentStep
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                      }`}
                    >
                      {h.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        {history.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-2xl mb-3">👆 Configure and insert keys to start</p>
            <p className="text-sm mb-4">Set minimum degree (t) and enter keys above</p>
            <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
              <p className="font-bold text-gray-800 mb-2">💡 Quick Start:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Set the minimum degree (t) using the slider</li>
                <li>Click "Load Example" to load the sample question</li>
                <li>Click "Insert All" to see the complete solution</li>
                <li>Use Previous/Next buttons to review each step</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BTreeVisualization;