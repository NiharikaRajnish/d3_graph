import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button, Typography } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import NodePopover from './NodePopover'; // Adjust import path as per your project structure
import LinkPopover from './LinkPopover'; // Adjust import path as per your project structure

const width = 1500;
const height = 600;

const NetworkGraph = () => {
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [anchorElNode, setAnchorElNode] = useState(null);
    const [anchorElLink, setAnchorElLink] = useState(null);
    const [linkingNode, setLinkingNode] = useState(null);
    const [linkingMessage, setLinkingMessage] = useState('');
    const svgRef = useRef(null);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const linkingNodeRef = useRef(linkingNode);

    useEffect(() => {
        linkingNodeRef.current = linkingNode;
    }, [linkingNode]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);

        const ticked = () => {
            svg.selectAll('.link')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
                .attr('stroke', d => {
                    switch (d.type) {
                        case 'Assesses':
                            return 'lightblue';
                        case 'Comes After':
                            return 'red';
                        case 'Is Part Of':
                            return 'grey';
                        default:
                            return '#df0d0d'; // Default color for unrecognized types
                    }
                });

            svg.selectAll('.node')
                .attr('transform', d => `translate(${d.x},${d.y})`);

            svg.selectAll('.nodeShape')
                .attr('d', d => getShapePath(d.shape)) // Update node shape path
                .attr('fill', d => d.color || color(d.type))
                .attr('transform', d => `scale(${getNodeScale(d.size)})`);

            svg.selectAll('.node text')
                .text(d => d.name); // Update node's label text
        };

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .on('tick', ticked);

        const update = () => {
            const link = svg.selectAll('.link')
                .data(links, d => `${d.source.id}-${d.target.id}`);

            link.exit().remove();

            const linkEnter = link.enter().append('line')
                .attr('class', 'link')
                .on('click', linkClicked) // Add click handler for links
                .merge(link)
                .attr('stroke', d => {
                    switch (d.type) {
                        case 'Assesses':
                            return 'lightblue';
                        case 'Comes After':
                            return 'red';
                        case 'Is Part Of':
                            return 'grey';
                        default:
                            return '#df0d0d'; // Default color for unrecognized types
                    }
                });

            const node = svg.selectAll('.node')
                .data(nodes, d => d.id);

            node.exit().remove();

            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .call(d3.drag()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded))
                .on('click', nodeClicked);

            nodeEnter.append('path')
                .attr('class', 'nodeShape')
                .attr('d', d => getShapePath(d.shape))
                .attr('fill', d => d.color || color(d.type))
                .attr('transform', d => `scale(${getNodeScale(d.size)})`)
                .attr('stroke', 'none') // Initialize stroke to none
                .attr('stroke-width', 0); // Initialize stroke width to 0

            nodeEnter.append('text')
                .attr('text-anchor', 'middle') // Center align text horizontally
                .attr('font-weight', 'bold')
                .attr('dy', '.35em') // Adjust vertical alignment relative to font size
                .attr('font-size', d => getNodeSize(d.size) / 2) // Dynamically set font size based on node size
                .text(d => d.name);

            node.merge(nodeEnter);

            simulation.nodes(nodes);
            simulation.force('link').links(links);
            simulation.alpha(1).restart();

            updateNodeBorders(selectedNode ? selectedNode.id : null); // Update node borders initially
        };

        update();

        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        function nodeClicked(event, d) {
            const currentLinkingNode = linkingNodeRef.current;

            if (currentLinkingNode && currentLinkingNode.id !== d.id) {
                const existingLink = links.find(link =>
                    (link.source.id === currentLinkingNode.id && link.target.id === d.id) ||
                    (link.source.id === d.id && link.target.id === currentLinkingNode.id)
                );

                if (!existingLink) {
                    setLinks(prevLinks => [...prevLinks, { source: currentLinkingNode, target: d }]);
                }

                setLinkingNode(null);
                setLinkingMessage('');
            } else {
                setSelectedNode(d);
                setSelectedLink(null); // Deselect link if a node is clicked
                setAnchorElNode(event.currentTarget); // Set anchor for node popover
                updateNodeBorders(d.id); // Add this line to update node borders

                // Deselect any previously clicked link
                d3.selectAll('.link.clicked').classed('clicked', false);
            }
        }

        function linkClicked(event, d) {
            setSelectedLink(d);
            setSelectedNode(null); // Deselect node if a link is clicked
            setAnchorElLink(event.currentTarget); // Set anchor for link popover
            updateLinkBorders(d.id); // Update link borders

            // Deselect any previously clicked node
            updateNodeBorders(null);

            // Select the clicked link and apply the 'clicked' class
            d3.select(event.target).classed('clicked', true);
        }

        function getShapePath(shape) {
            switch (shape) {
                case 'Automic ER':
                    return d3.symbol().type(d3.symbolCircle)();
                case 'aER':
                    return d3.symbol().type(d3.symbolSquare)();
                case 'iER':
                    return d3.symbol().type(d3.symbolTriangle)();
                case 'rER':
                    return d3.symbol().type(d3.symbolSquare)();
                default:
                    return d3.symbol().type(d3.symbolCircle)();
            }
        }

        function getNodeSize(size) {
            return Math.sqrt(size) * 2; // Adjust scale factor based on your preference
        }

        function getNodeScale(size) {
            return Math.sqrt(size) * 2; // Adjust scale factor based on your preference
        }

        function updateNodeBorders(selectedNodeId) {
            d3.select(svgRef.current).selectAll('.nodeShape')
                .attr('stroke', d => (d.id === selectedNodeId ? 'black' : 'none'))
                .attr('stroke-width', d => (d.id === selectedNodeId ? 0.5 : 0));
        }

        function updateLinkBorders(selectedLinkId) {
            d3.select(svgRef.current).selectAll('.link')
                .attr('stroke', d => (d === selectedLinkId ? 'black' : '#df0d0d'))
                .attr('stroke-width', d => (d === selectedLinkId ? 5 : 3))
                .classed('clicked', d => d === selectedLinkId);
        }

    }, [nodes, links]);

    const handleCloseNode = () => {
        setAnchorElNode(null);
        setLinkingMessage('');
    };
    const handleCloseLink = () => {
        setAnchorElLink(null);
        setLinkingMessage('');
    };

    const handleShapeChange = (newShape) => {
        if (selectedNode) {
            selectedNode.shape = newShape;
            switch (newShape) {
                case 'Automic ER':
                    selectedNode.color = '#ADD8E6';
                    break;
                case 'aER':
                    selectedNode.color = 'orange';
                    break;
                case 'iER':
                    selectedNode.color = 'red';
                    break;
                case 'rER':
                    selectedNode.color = 'green';
                    break;
                default:
                    selectedNode.color = color('default');
            }
            setNodes([...nodes]); // Trigger re-render to update node shape and color
        }
    };

    const handleSizeChange = (newSize) => {
        if (selectedNode) {
            selectedNode.size = newSize;
            setNodes([...nodes]); // Trigger re-render to update node size
        }
    };
    const handleTypeChange = (newType) => {
        if (selectedLink) {
            selectedLink.type = newType;
            setLinks([...links]); // Trigger re-render to update link type
        }
    };

    const handleRenameNode = (newName) => {
        if (selectedNode) {
            selectedNode.name = newName;
            setNodes([...nodes]); // Trigger re-render to update node name
        }
    };

    const handleAddNode = () => {
        const id = nodes.length ? nodes[nodes.length - 1].id + 1 : 1;
        const name = `Node ${id}`;
        const newNode = { id, name, shape: 'circle', size: 7, color: '#ADD8E6', x: width / 2, y: height / 2 };
        setNodes([...nodes, newNode]);
    };

    const handleRemoveNode = () => {
        if (selectedNode) {
            const nodeId = selectedNode.id;
            setNodes(nodes.filter(n => n.id !== nodeId));
            setLinks(links.filter(l => l.source.id !== nodeId && l.target.id !== nodeId));
            setSelectedNode(null);
        } else {
            setLinkingMessage('Select a node to delete');
            setTimeout(() => setLinkingMessage(''), 2000); // Clear the message after 2 seconds
        }
    };

    const handleAddLink = () => {
        setLinkingNode(selectedNode);
        setAnchorElNode(null);
        setLinkingMessage('Click another node to establish a link');
    };

    const handleRemoveLink = () => {
        if (selectedLink) {
            setLinks(links.filter(l => l !== selectedLink));
            setSelectedLink(null);
        } else {
            setLinkingMessage('Select a link to delete');
            setTimeout(() => setLinkingMessage(''), 2000); // Clear the message after 2 seconds
        }
    };



    return (
        <div>
            <Button onClick={handleAddNode} startIcon={<Add />} variant="outlined">Add Node</Button>
            <Button onClick={handleRemoveNode} startIcon={<Remove />} variant="outlined">Remove Node</Button>
            <Button onClick={handleRemoveLink} startIcon={<Remove />} variant="outlined">Remove Link</Button>
            <svg ref={svgRef} width={width} height={height}></svg>
            {linkingMessage && (
                <Typography
                    variant="body1"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: '4px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                    }}
                >
                    {linkingMessage}
                </Typography>
            )}
            {selectedNode && (
                <NodePopover
                    id="node-popover"
                    open={Boolean(anchorElNode)}
                    anchorEl={anchorElNode}
                    onClose={handleCloseNode}
                    handleAddLink={handleAddLink}
                    selectedNode={selectedNode}
                handleShapeChange={handleShapeChange}
                handleSizeChange={handleSizeChange}
                handleRenameNode={handleRenameNode}
                />
            )}
            {selectedLink && (
                <LinkPopover
                    id="link-popover"
                    open={Boolean(anchorElLink)}
                    anchorEl={anchorElLink}
                    onClose={handleCloseLink}
                    handleTypeChange={handleTypeChange}
                    handleRemoveLink={handleRemoveLink}
                    selectedLink={selectedLink}
                />
            )}
        </div>
    );
};

export default NetworkGraph;
