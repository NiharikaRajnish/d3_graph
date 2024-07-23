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
    const [filterType, setFilterType] = useState('3');
    const [hoveredNode, setHoveredNode] = useState(null);
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
                            return 'red';
                        case 'Is Part Of':
                            return 'grey';
                   
                    }
                })
                .lower(); // Move links below node shapes
            svg.selectAll('.nodeLabel')
                .text(d => d.name) // Update node's label text
                .attr('style', 'font-weight: bold; font-size: 8px;')
        };

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links.filter(l => !l.hidden)).id(d => d.id).distance(110)) // Link force
            .force('charge', d3.forceManyBody().strength(-1000).distanceMax(175).distanceMin(1)) // Charge force to repel nodes
            .force('center', d3.forceCenter(width / 2, height / 2)) // Centering force
            .on('tick', ticked)

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
       
                }
            });

        const node = svg.selectAll('.node')
            .data(nodes.filter(n => !n.hidden), d => d.id);


        node.exit().remove();

        const nodeEnter = node.enter().append('g')
            .merge(node)
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
            // .attr('transform', d => `scale(${getNodeScale(d.size)})`)
            .attr('stroke', 'none') // Initialize stroke to none
            .attr('stroke-width', 0) // Initialize stroke width to 0
        // .on('mouseover', handleNodeHover); // Attach mouseover event handler

        nodeEnter.append('text')
            .attr('class', 'nodeLabel') // Add a class for styling
            .attr('text-anchor', 'middle') // Center align text horizontally
            .attr('font-weight', 'bold')
            .attr('dy', '.35em') // Adjust vertical alignment relative to font size
            .attr('font-size', d => getNodeSize(d.size) / 2) // Dynamically set font size based on node size
            .text(d => d.name)

        nodeEnter.append('text')
            .attr('class', 'nodeTypeLabel') // Add a class for styling
            .attr('text-anchor', 'middle')
            .attr('dy', '-3.5em') // Adjust position above the node
            // .attr('font-weight', 'bold')
            // .attr('font-size', '12px')
            .style('pointer-events', 'none') // Avoid capturing events on text
            .attr('style', 'opacity: 0;')
        // Transition to show text on mouseover
        nodeEnter.on('mouseover', (event, d) => {
            d3.select(event.currentTarget).select('.nodeTypeLabel')
                .text(d.shape) // Set the text content to d.shape
                .style('opacity', 1); // Make the label visible
        }).on('mouseout', (event, d) => {
            d3.select(event.currentTarget).select('.nodeTypeLabel')
                .style('opacity', 0); // Hide the label on mouseout
        });


        node.merge(nodeEnter)
            .attr('transform', d => `translate(${d.fx},${d.fy})`)

        // simulation.nodes(nodes);
        // simulation.force('link').links(links);
        simulation.alpha(0.3).restart(); // Use a lower alpha value to minimize layout disruptions

        updateNodeBorders(selectedNode ? selectedNode.id : null); // Update node borders initially

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


        function linkClicked(event, d) {
            setSelectedLink(d);
            setSelectedNode(null); // Deselect node if a link is clicked
            setAnchorElLink(d); // Set anchor for link popover
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
            node.remove();
            link.remove();
            simulation.stop(); // Stop simulation on component unmount
        };

    }, [links]);


    const handleCloseNode = () => {
        setSelectedNode(null);
        setAnchorElNode(false);
        updateNodeBorders(null);
        setLinkingMessage('');
    };
    const handleCloseLink = () => {
        d3.selectAll('.link.clicked').classed('clicked', false);
        setSelectedLink(null);
        setAnchorElLink(false);
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
            setAnchorElNode(selectedNode)
        }
    };
    const handleTypeChange = (newType) => {
        if (selectedLink) {
            selectedLink.type = newType;
            selectedLink.source.asseses = null;
            selectedLink.source.comesAfter = null;
            selectedLink.source.isPartOf = null;
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
            setLinks([...links]); // Trigger re-render to update link type
            
           //  setNodes([...nodes]); // Trigger re-render to update nodes

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
        const maxIdNode = nodes.reduce((maxNode, node) => ((node.id > maxNode.id) && (node.id !== 53421)) ? node : maxNode, nodes[0]);
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

    function nodeClicked(event, d) {
        const currLN = linkingNodeRef.current;

        if (currLN && currLN.id !== d.id) {
            const existingLink = links.find(link =>
                (link.source.id === currLN.id && link.target.id === d.id) ||
                (link.source.id === d.id && link.target.id === currLN.id)
            );
            // const cLN = nodes.find(n => n.id === currentLinkingNode.id)
            if (!existingLink) {
                currLN.comesAfter = d.id

                // if (currLN.shape === 'Atomic ER' && (d.shape === 'diamond' || d.shape === 'Atomic ER')) {
                //     currLN.comesAfter ? d.comesAfter = currLN.id : currLN.comesAfter = d.id
                // } else if (currLN.shape === 'Atomic ER' && d.shape === 'iER') {
                //     currLN.isPartOf = d.id
                // } else if (currLN.shape === 'Atomic ER' && d.shape === 'aER') {
                //     currLN.isPartOf = d.id
                // } else if (currLN.shape === 'Atomic ER' && d.shape === 'rER') {
                //     // setLinkingMessage('Atomic ER cannot link with rER');
                //     // setTimeout(() => setLinkingMessage(''), 2000);
                //     currLN.isPartOf = d.id
                // } else if (currLN.shape === 'diamond' && d.shape === 'Atomic ER') {
                //     currLN.comesAfter ? d.comesAfter = currLN.id : currLN.comesAfter = d.id
                // } else if (currLN.shape === 'iER' && d.shape === 'Atomic ER') {
                //     d.isPartOf = currLN.id
                // } else if (currLN.shape === 'iER' && d.shape === 'aER') {
                //     d.isPartOf = currLN.id
                // } else if (currLN.shape === 'iER' && d.shape === 'rER') {
                //     // setLinkingMessage('iER cannot link with rER');
                //     // setTimeout(() => setLinkingMessage(''), 2000);
                //     currLN.comesAfter = d.id
                // } else if (currLN.shape === 'iER' && d.shape === 'diamond') {
                //     currLN.comesAfter ? d.comesAfter = currLN.id : currLN.comesAfter = d.id
                // } else if (currLN.shape === 'aER' && d.shape === 'iER') {
                //     currLN.comesAfter = d.id
                // } else if (currLN.shape === 'aER' && d.shape === 'rER') {
                //     d.asseses = currLN.id
                // } else if (currLN.shape === 'rER' && d.shape === 'aER') {
                //     currLN.asseses = d.id
                // } else if (currLN.shape === 'rER' && d.shape !== 'aER') {
                //     // setLinkingMessage('Only aER can be linked with rER');
                //     // setTimeout(() => setLinkingMessage(''), 2000);
                //     currLN.asseses = d.id
                // } else {
                //     setLinkingMessage('Linking between selected nodes is not allowed');
                //     setTimeout(() => setLinkingMessage(''), 2000);
                // }

                setNodes([...nodes]);
                // setLinks(prevLinks => [...prevLinks, { source: currentLinkingNode, target: d, type: 'Comes After' }]);
            }

            setLinkingNode(null);
            setLinkingMessage('');
        } else {
            setSelectedNode(d);
            setSelectedLink(null); // Deselect link if a node is clicked
            setAnchorElNode(d); // Set anchor for node popover
            updateNodeBorders(d.id); // Add this line to update node borders

            // Deselect any previously clicked link
            d3.selectAll('.link.clicked').classed('clicked', false);
        }
    }
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
        const countIERNodes = parsedData.filter(node => node.shape === 'iER').length;
        let cnt = 0;
        parsedData.forEach((node, index) => {
            if (node.shape === 'iER') {
                cnt++;
                node.fy = height / 2;
                node.x = (cnt * (width / countIERNodes)) - radius;
            }
        });
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
        setAnchorElNode(false);
        setLinkingMessage('Click another node to establish a link');
    };

    const handleRemoveLink = () => {
        if (selectedLink) {
            var curr_type = selectedLink.type.trim();
            curr_type = curr_type.split(' ').join('');
            curr_type = curr_type.charAt(0).toLowerCase() + curr_type.slice(1);

            selectedLink.source[curr_type] = null;
            selectedLink.target[curr_type] = null;


            setLinks(links.filter(l => l !== selectedLink));
            setSelectedLink(null);
        } else {
            setLinkingMessage('Select a link to delete');
            setTimeout(() => setLinkingMessage(''), 2000); // Clear the message after 2 seconds
        }
    };

    const handleFilterNodes = (filterType) => {
        // Update nodes with hidden property based on filterType
        const updatedNodes = nodes.map(node => {
            let hidden = false;

            if (node.id === 0 || node.id === 54321) {
                hidden = false; // Always show nodes with id 1 and 2
            } else {
                switch (filterType) {
                    case "1":
                        hidden = !(node.shape === 'aER' || node.shape === 'rER');
                        break;
                    case "2":
                        hidden = node.shape == 'Atomic ER';
                        break;
                    case "3":
                        hidden = false; // Show all nodes
                        break;
                    case "4":
                        // Implement your logic for View 4
                        break;
                    default:
                        hidden = false;
                }
            }

            return {
                ...node,
                hidden
            };
        });
        setNodes([...updatedNodes]);
        // const newLinks = filterType ? processLinks(nodes.filter(n => !n.hidden)) : [];
        // setLinks(newLinks);
        // handleFilterLinks(filterType);

    };

    const handleFilterLinks = (filterType) => {
        const updatedLinks = links.map(link => {
            let hidden = false;

            switch (filterType) {
                case "1":
                    hidden = (link.source.shape === 'iER' || link.source.shape === 'Atomic ER' || link.target.shape === 'Atomic ER' || link.target.shape === 'iER');
                    break;
                case "2":
                    hidden = (link.source.shape === 'Atomic ER' || link.target.shape === 'Atomic ER');
                    break;
                case "3":
                    hidden = false; // Show all links
                    break;
                case "4":
                    // Implement your logic for View 4
                    break;
                default:
                    hidden = false;
            }

            return {
                ...link,
                hidden
            };
        });

        setLinks(updatedLinks); // Update state for links
    };

    const handleNodeHover = (event, d) => {
        // Set the hovered node in state
        setHoveredNode(d);
    };

    const handleNodeMouseOut = () => {
        // Clear the hovered node state
        setHoveredNode(null);
    };

    const updateNodeBorders = (selectedNodeId) => {
        d3.select(svgRef.current).selectAll('.nodeShape')
            .attr('stroke', d => (d.id === selectedNodeId ? 'black' : 'none'))
            .attr('stroke-width', d => (d.id === selectedNodeId ? 0.5 : 0));
    }

    const updateLinkBorders = (selectedLinkId) => {

        d3.select(svgRef.current).selectAll('.link')
            // .attr('stroke', d => (d === selectedLinkId ? 'black' : 'none'))
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
                <InputLabel>Views</InputLabel>
                <Select
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value);
                        handleFilterNodes(e.target.value);
                    }}
                    label="View"
                >
                    <MenuItem value="1">View 1: Summative assessment only</MenuItem>
                    <MenuItem value="2">View 2: Course Overview</MenuItem>
                    <MenuItem value="3">View 3: All ERs</MenuItem>
                    <MenuItem value="4">View 4: Requirements</MenuItem>
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
                 console.log(anchorElNode),
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
