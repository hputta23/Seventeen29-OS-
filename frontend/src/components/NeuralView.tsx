import { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
    { id: '1', position: { x: 250, y: 0 }, data: { label: 'Incident #2491' }, type: 'input', style: { border: '1px solid #ef4444', background: '#331111', color: 'white' } },
    { id: '2', position: { x: 100, y: 150 }, data: { label: 'Risk Assessment RA-09' }, style: { border: '1px solid #10b981', background: '#064e3b', color: 'white' } },
    { id: '3', position: { x: 400, y: 150 }, data: { label: 'John Doe (Operator)' }, style: { border: '1px solid #3b82f6', background: '#1e3a8a', color: 'white' } },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, label: 'MITIGATED_BY', style: { stroke: '#10b981' } },
    { id: 'e1-3', source: '1', target: '3', label: 'INVOLVES', style: { stroke: '#3b82f6' } },
];

export default function NeuralView() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        // Simulation of Lazy Loading / Drill Down
        console.log('Drill down into node:', node.id);
        const newNodeId = `${node.id}-child-${Date.now()}`;

        // Add a mock child node
        const newNode: Node = {
            id: newNodeId,
            position: { x: node.position.x + 50, y: node.position.y + 150 },
            data: { label: `Linked Entity (Lazy Loaded)` },
            style: { border: '1px solid #fbbf24', background: '#451a03', color: 'white' }
        };

        const newEdge: Edge = {
            id: `e${node.id}-${newNodeId}`,
            source: node.id,
            target: newNodeId,
            animated: true,
            style: { stroke: '#fbbf24' }
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
    }, [setNodes, setEdges]);

    return (
        <div className="h-[700px] glass-panel rounded-xl overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
                className="bg-slate-900"
            >
                <Background color="#334155" gap={16} />
                <Controls className="bg-white/10 border border-white/20 text-white" />
                <MiniMap className="bg-slate-900 border border-white/20" nodeColor={() => '#64748b'} />

                <div className="absolute top-4 left-4 z-10 glass-panel px-4 py-2">
                    <h3 className="font-bold text-emerald-400">Neural Network Active</h3>
                    <p className="text-xs text-slate-400">Real-time Safety Linkage</p>
                </div>
            </ReactFlow>
        </div>
    );
}
