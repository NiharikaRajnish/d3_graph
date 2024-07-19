import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button, Typography } from '@mui/material';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Remove, FilterList } from '@mui/icons-material';
import NodePopover from './NodePopover'; // Adjust import path as per your project structure
import LinkPopover from './LinkPopover'; // Adjust import path as per your project structure

const width = window.innerWidth * 0.9,
    height = 600,
    radius = 15;

const NetworkGraph = () => {
    const initialNodes = [
        { id: 0, name: 'start', shape: 'diamond', size: 10, color: 'green', fx: 50, fy: height / 2, fixed: true, asseses: null, isPartOf: null, comesAfter: null }, // Fixed position for start node
        { id: 54321, name: 'end', shape: 'diamond', size: 10, color: 'green', fx: width - 50, fy: height / 2, fixed: true, asseses: null, isPartOf: null, comesAfter: null } // Fixed position for end node
    ];
    const initialLinks = [];

    const [nodes, setNodes] = useState(initialNodes);
    const [links, setLinks] = useState(initialLinks);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [anchorElNode, setAnchorElNode] = useState(null);
    const [anchorElLink, setAnchorElLink] = useState(null);
    const [linkingNode, setLinkingNode] = useState(null);
    // const [nodeMap, setNodeMap] = useState(new Map());
    const [linkingMessage, setLinkingMessage] = useState('');
    const [filterType, setFilterType] = useState('All');
    const svgRef = useRef(null);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const linkingNodeRef = useRef(linkingNode);

    useEffect(() => {
        linkingNodeRef.current = linkingNode;
    }, [linkingNode]);

    useEffect(() => {
        const newLinks = filterType ? processLinks(nodes.filter(n => !n.hidden)) : [];
        setLinks(newLinks);
    }, [nodes]);

    const handleKeyDown = (event) => {
        if ((event.key === 'Delete' || event.key === '-') && selectedNode) {
            handleRemoveNode();
        } else if ((event.key === 'Delete' || event.key === '-') && selectedLink) {
            handleRemoveLink();
        } else if (event.key === '+' && !selectedNode && !selectedLink) {
            handleAddNode();
        } else if (event.key === '+' && selectedNode && !selectedLink) {
            handleAddLink();
        }
    };
    useEffect(() => {

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNode, selectedLink]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const ticked = () => {

            svg.selectAll('.node')
                .attr('transform', d => `translate(${d.x},${d.y})`)
                .attr("cx", (d) => { return d.x = Math.max(radius, Math.min(svgRef.current.clientWidth - 100 - radius, d.x)); })
                .attr("cy", (d) => { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });

            svg.selectAll('.nodeShape')
                .attr('d', d => getShapePath(d.shape)) // Update node shape path
                .attr('fill', d => d.color || color(d.type))
                .attr('transform', d => `scale(${getNodeScale(d.size)})`);

            svg.selectAll('.link')
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
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
                })
                .lower(); // Move links below node shapes
            svg.selectAll('.node text')
                .text(d => d.name) // Update node's label text
                .attr('style', 'font-weight: bold; font-size: 8px;')
        };

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(125)) // Link force
            .force('charge', d3.forceManyBody().strength(-1000).distanceMax(150).distanceMin(1)) // Charge force to repel nodes
            .force('center', d3.forceCenter(width / 2, height / 2)) // Centering force
            .on('tick', ticked);

        const update = () => {
            const link = svg.selectAll('.link')
                .data(links, d => `${d.source.id}-${d.target.id}`)
            // .data(links.filter(l => !l.hidden), d => `${d.source.id}-${d.target.id}`);

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
                .text(d => d.name)
                .on('click', nodeClicked);

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
                const cLN = nodes.find(n => n.id === currentLinkingNode.id)
                if (!existingLink) {
                    currentLinkingNode.comesAfter = d.id;
                    cLN && (cLN.comesAfter = d.id);
                    !cLN ? setNodes([...nodes, currentLinkingNode]) : setNodes([...nodes]);
                    // setLinks(prevLinks => [...prevLinks, { source: currentLinkingNode, target: d, type: 'Comes After' }]);
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

        return () => {
            simulation.stop(); // Stop simulation on component unmount
        };

    }, [links]);

    const handleCloseNode = () => {
        setSelectedNode(null);
        setAnchorElNode(null);
        updateNodeBorders(null);
        setLinkingMessage('');
    };
    const handleCloseLink = () => {
        d3.selectAll('.link.clicked').classed('clicked', false);
        setSelectedLink(null);
        setAnchorElLink(null);
        updateLinkBorders(null);
        updateNodeBorders(null);
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
            // setLinks([...links]);
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
            switch (newType) {
                case 'Assesses':
                    nodes.find(n => n.id === selectedLink.source.id).assess = selectedLink.target.id;
                    break;
                case 'Comes After':
                    nodes.find(n => n.id === selectedLink.source.id).comesAfter = selectedLink.target.id;
                    break;
                case 'Is Part Of':
                    nodes.find(n => n.id === selectedLink.source.id).isPartOf = selectedLink.target.id;
                    break;
            }
            setNodes([...nodes]); // Trigger re-render to update link type
        }
    };

    const handleRenameNode = (newName) => {
        if (selectedNode) {
            selectedNode.name = newName;
            setNodes([...nodes]); // Trigger re-render to update node name
            // setLinks([...links]);
        }
    };

    const handleAddNode = () => {
        const id = nodes.length ? nodes[nodes.length - 1].id + 1 : 1;
        const name = `Node ${id}`;
        const newNode = { id, name, shape: 'Atomic ER', size: 7, color: '#ADD8E6', x: width / 2, y: height / 2, asseses: null, isPartOf: null, comesAfter: null };
        setNodes([...nodes, newNode]);
        // setLinks([...links]);

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
        // const tmpNodeMap = new Map();
        const parsedData = d3.csvParse(data, ({ identifier, title, description, url, type, isPartOf, isFormatOf, assesses, comesAfter }) => {
            const node = {
                id: +identifier,
                name: title,
                description,
                url,
                type,
                size: 7,
                isPartOf: isPartOf ? +isPartOf : null,
                isFormatOf: +isFormatOf,
                assesses: assesses ? +assesses : null,
                comesAfter: comesAfter ? +comesAfter : null,
                shape: type in { 'Atomic ER': 1, 'aER': 1, 'iER': 1, 'rER': 1 } ? type : 'Atomic ER',
            }
            // tmpNodeMap.set(node.id, node);
            return node
        })

        const filteredNodes = parsedData.filter(node => node.comesAfter && !node.assesses && !node.isPartOf);
        const maxIdNode = filteredNodes.reduce((maxNode, node) => node.id > maxNode.id ? node : maxNode, filteredNodes[0]);
        // const minIdNode = filteredNodes.reduce((minNode, node) => node.id < minNode.id ? node : minNode, filteredNodes[0]);
        const tmpNodes = nodes.map(node => {
            if (node.id === 54321) {
                const updEnd = {
                    ...node,
                    comesAfter: maxIdNode.id
                }
                // tmpNodeMap.set(updEnd.id, updEnd);
                parsedData.push(updEnd);
            }
            else {
                // tmpNodeMap.set(node.id, node);
                parsedData.push(node)
            };
            return node

        })

        // setNodeMap(tmpNodeMap);
        // const newLinks = processLinks(parsedData);
        setNodes(parsedData);
        // setLinks(newLinks);
    };

    const processLinks = (parsedData) => {
        const newLinks = [];
        parsedData.forEach(node => {
            if (typeof node.isPartOf == 'number') {
                const targetNode = parsedData.find(n => n.id === node.isPartOf);
                if (targetNode) {
                    newLinks.push({ source: node, target: targetNode, type: 'Is Part Of' });
                }
            }
            if (typeof node.assesses == 'number') {
                const targetNode = parsedData.find(n => n.id === node.assesses);
                if (targetNode) {
                    newLinks.push({ source: node, target: targetNode, type: 'Assesses' });
                }
            }
            if (typeof node.comesAfter == 'number') {
                const targetNode = parsedData.find(n => n.id === node.comesAfter);
                if (targetNode) {
                    newLinks.push({ source: node, target: targetNode, type: 'Comes After' });
                }
            }
        });
        return newLinks;
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
            hidden: (filterType === 'All' || node.id === 0 || node.id === 54321) ? false : (node.shape !== filterType)
        })));
        // const newLinks = filterType ? processLinks(nodes.filter(n => !n.hidden)) : [];
        // setLinks(newLinks);
    };

    const updateNodeBorders = (selectedNodeId) => {
        d3.select(svgRef.current).selectAll('.nodeShape')
            .attr('stroke', d => (d.id === selectedNodeId ? 'black' : 'none'))
            .attr('stroke-width', d => (d.id === selectedNodeId ? 0.5 : 0));
    }

    const updateLinkBorders = (selectedLinkId) => {
        d3.select(svgRef.current).selectAll('.link')
            .attr('stroke', d => (d === selectedLinkId ? 'black' : '#df0d0d'))
            .attr('stroke-width', d => (d === selectedLinkId ? 5 : 3))
            .classed('clicked', d => d === selectedLinkId);
    }

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
            <FormControl variant="outlined" style={{ position: 'absolute', size: 'small', right: '80px', margin: '6px', width: '150px' }}>
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
                    <MenuItem value="All"><em>All</em></MenuItem>
                    <MenuItem value="Atomic ER">Atomic ER</MenuItem>
                    <MenuItem value="aER">aER</MenuItem>
                    <MenuItem value="iER">iER</MenuItem>
                    <MenuItem value="rER">rER</MenuItem>
                </Select>
            </FormControl>
            <svg ref={svgRef} width='100%' height='80vh' viewBox={`0 0 ${width} ${height}`}></svg>
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
                    sourceNodeType={selectedLink.source ? selectedLink.source.type : null}

                />
            )}
        </div>
    );
};

export default NetworkGraph;
