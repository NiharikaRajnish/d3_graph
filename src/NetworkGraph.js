import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button, Typography } from '@mui/material';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Remove, FilterList } from '@mui/icons-material';
import NodePopover from './NodePopover'; // Adjust import path as per your project structure
import LinkPopover from './LinkPopover'; // Adjust import path as per your project structure

const width = 1500;
const height = 600;

const NetworkGraph = () => {
    const initialNodes = [
        { id: 1, name: 'start', shape: 'diamond', size: 10, color: 'green', fx: 100, fy: height / 2, fixed: true }, // Fixed position for start node
        { id: 2, name: 'end', shape: 'diamond', size: 10, color: 'green', fx: width - 200, fy: height / 2, fixed: true } // Fixed position for end node
    ];
    const initialLinks = [];

    const [nodes, setNodes] = useState(initialNodes);
    const [links, setLinks] = useState(initialLinks);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [anchorElNode, setAnchorElNode] = useState(null);
    const [anchorElLink, setAnchorElLink] = useState(null);
    const [linkingNode, setLinkingNode] = useState(null);
    const [linkingMessage, setLinkingMessage] = useState('');
    const [filterType, setFilterType] = useState('');
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
                .attr('x1', d => {
                    if (d.type === 'Is Part Of') {
                        return d.source.x;
                    } else {
                        return d.source.x < d.target.x ? d.source.x + (d.source.size * 3.2) : d.source.x - (d.source.size * 3.2);
                    }
                })
                .attr('y1', d => {
                    if (d.type === 'Is Part Of') {
                        return d.target.y < d.source.y ? d.source.y - (d.source.size * 3.2): d.source.y + (d.source.size * 3.2) ;
                    } else {
                        return d.source.y;
                    }
                })
                .attr('x2', d => {
                    if (d.type === 'Is Part Of') {
                        return d.target.x;
                    } else {
                        return d.source.x < d.target.x ? d.target.x - (d.target.size * 3.2) : d.target.x + (d.target.size * 3.2);
                    }
                })
                .attr('y2', d => {
                    if (d.type === 'Is Part Of') {
                        return d.source.y < d.target.y ? d.target.y - (d.target.size * 3.2): d.target.y + (d.target.size * 3.2) ;
                    } else {
                        return d.target.y;
                    }
                })
                .attr('stroke', d => {
                    switch (d.type) {
                        case 'Assesses':
                            return 'lightblue';
                        case 'Comes After':
                            return '#df0d0d';
                        case 'Is Part Of':
                            return 'grey';
                        default:
                            return '#df0d0d'; 
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
            .force('link', d3.forceLink(links).id(d => d.id).distance(100)) // Link force
            .force('charge', d3.forceManyBody().strength(-200)) // Charge force to repel nodes
            .force('center', d3.forceCenter(width / 2, height / 2)) // Centering force
    
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
                .data(nodes.filter(n => !n.hidden), d => d.id);

            node.exit().remove();

            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .call(d3.drag()
                    .filter(d => !d.fx && !d.fy)
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded))
                .on('click', nodeClicked);

            nodeEnter.append('path')
                .attr('class', 'nodeShape')
                .attr('d', d => getShapePath(d.shape))
                .attr('fill', d => d.color || color(d.type))
                // .attr('transform', d => `scale(${getNodeScale(d.size)})`)
                .attr('stroke', 'none') // Initialize stroke to none
                .attr('stroke-width', 0); // Initialize stroke width to 0

            nodeEnter.append('text')
                .attr('text-anchor', 'middle') // Center align text horizontally
                .attr('font-weight', 'bold')
                .attr('dy', '.35em') // Adjust vertical alignment relative to font size
                .attr('font-size', d => getNodeSize(d.size) / 2) // Dynamically set font size based on node size
                .text(d => d.name);

            node.merge(nodeEnter)
                .attr('transform', d => `translate(${d.fx},${d.fy})`)

            simulation.nodes(nodes);
            simulation.force('link').links(links);
            simulation.alpha(1).restart();

            updateNodeBorders(selectedNode ? selectedNode.id : null); // Update node borders initially
        };

        update();

        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            if (!d.fixed) {
                d.fx = d.x;
                d.fy = d.y;
            }
        }

        function dragged(event, d) {
            if (!d.fixed) {
                d.fx = event.x;
                d.fy = event.y;
            }
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            if (!d.fixed) {
                d.fx = null;
                d.fy = null;
            }
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
                case 'diamond':
                    return d3.symbol().type(d3.symbolDiamond)();
                case 'Atomic ER':
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
            return Math.sqrt(size) * 2;
        }

        function getNodeScale(size) {
            return Math.sqrt(size) * 2;
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

        return () => {
            simulation.stop(); // Stop simulation on component unmount
        };

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
                case 'Atomic ER':
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
        const newNode = { id, name, shape: 'Atomic ER', size: 7, color: '#ADD8E6', x: width / 2, y: height / 2 };
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

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                parseCSV(text);
            };
            reader.readAsText(file);
        }
    };

    const parseCSV = (data) => {
        const parsedData = d3.csvParse(data);
    
        const nodeMap = new Map();
        const newNodes = parsedData.map(d => {
            const node = {
                id: +d.ID,
                name: d.name,
                alternativeTitle: d['alternative title'],
                targetURL: d['target URL'],
                type: d.type,
                isPartOf: d.isPartOf,
                assesses: d.assesses,
                comesAfter: d.comesAfter,
                shape: 'Atomic ER',  // Default shape
                size: 7,  // Default size
                color: '#ADD8E6'  // Default color
            };
            nodeMap.set(node.id, node);
            return node;
        });
    
        const newLinks = [];
        newNodes.forEach(node => {
            if (node.isPartOf) {
                const targetNode = nodeMap.get(+node.isPartOf);
                if (targetNode) {
                    newLinks.push({ source: node, target: targetNode, type: 'Is Part Of' });
                }
            }
            if (node.assesses) {
                const targetNode = nodeMap.get(+node.assesses);
                if (targetNode) {
                    newLinks.push({ source: node, target: targetNode, type: 'Assesses' });
                }
            }
            if (node.comesAfter) {
                const targetNode = nodeMap.get(+node.comesAfter);
                if (targetNode) {
                    newLinks.push({ source: node, target: targetNode, type: 'Comes After' });
                }
            }
        });
    
        setNodes(newNodes);
        setLinks(newLinks);
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

    const handleFilterNodes = (filterType) => {
        setNodes(nodes.map(node => ({
            ...node,
            hidden: (node.id === 1 || node.id === 2) ? false : (filterType ? node.shape !== filterType : false)
        })));
    };

    return (
        <div>
            <input
    type="file"
    accept=".csv"
    onChange={handleFileUpload}
    style={{ display: 'none' }}
    id="csv-upload"
/>
<label htmlFor="csv-upload">
    <Button variant="contained" component="span">
        Upload CSV
    </Button>
</label>
            <Button onClick={handleAddNode} startIcon={<Add />} variant="outlined">Add Node</Button>
            <Button onClick={handleRemoveNode} startIcon={<Remove />} variant="outlined">Remove Node</Button>
            <FormControl variant="outlined" style={{ position: 'absolute', size: 'small', right: '80px' , margin: '6px', width: '150px'}}>
            <InputLabel>Filter Nodes</InputLabel>
            <Select
            value={filterType}
            onChange={(e) => {
            setFilterType(e.target.value);
            handleFilterNodes(e.target.value);
        }}
            label="Filter Nodes"
            >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="Atomic ER">Atomic ER</MenuItem> 
            <MenuItem value="aER">aER</MenuItem>
            <MenuItem value="iER">iER</MenuItem>
            <MenuItem value="rER">rER</MenuItem>
            </Select>
            </FormControl>
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
                    sourceNodeType = {selectedLink.source ? selectedLink.source.type : null}
                  
                />
            )}
        </div>
    );
};

export default NetworkGraph;
