import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Alert, Button, FormControlLabel, FormGroup, Switch, Typography } from '@mui/material';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, ErrorOutline, Visibility } from '@mui/icons-material';
import NodePopover from './NodePopover';
import LinkPopover from './LinkPopover';
import Navbar from './Navbar';
import { useSlider } from './SliderContext';
import exportSvg from './ExportSvg'; // Import the function
import { type } from '@testing-library/user-event/dist/type';



const NetworkGraph = () => {
    let width = window.innerWidth * 0.9,
        height = window.innerHeight * 0.9;
    const initialNodes = [
        { id: 0, name: 'start', type: 'start', shape: 'diamond', size: 10, color: 'green', fx: 50, fy: height / 2, fixed: true, assesses: null, isPartOf: null, comesAfter: null }, // Fixed position for start node
        { id: 54321, name: 'end', type: 'end', shape: 'diamond', size: 10, color: 'green', fx: width - 50, fy: height / 2, fixed: true, assesses: null, isPartOf: null, comesAfter: null } // Fixed position for end node
    ];
    const initialLinks = [];

    const [nodes, setNodes] = useState(initialNodes);
    const [links, setLinks] = useState(initialLinks);
    const [selectedNode, setSelectedNode] = useState(null);
    const [shiftPressed, setShiftPressed] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState([0]);
    const [selectedLink, setSelectedLink] = useState(null);
    const [nodeSet, setNodeSet] = useState({ '1': null, '2': null, '3': null, '4': null });
    const [anchorElNode, setAnchorElNode] = useState(null);
    const [anchorElMultiNode, setAnchorElMultiNode] = useState(null);
    const [anchorElLink, setAnchorElLink] = useState(null);
    const [linkingNode, setLinkingNode] = useState(null);
    const [legendToggled, setLegendToggled] = useState(false);
    const [labelsToggled, setLabelsToggled] = useState(false);
    const [linkingMessage, setLinkingMessage] = useState('');
    const [filterType, setFilterType] = useState('3');
    const [isAlertError, setIsAlertError] = useState(false);
    const currNodesNumRef = useRef(0);
    const currShownNodesNumRef = useRef(0);
    const prevNodesNumRef = useRef(0);
    const prevShownNodesNumRef = useRef(0);
    const svgRef = useRef(null);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const linkingNodeRef = useRef(linkingNode);
    const { sliderValue, setSliderValue, aERSliderValue, setaERSliderValue, iERSliderValue, setIERSliderValue, rERSliderValue, setrERSliderValue, atomicSliderValue, setatomicSliderValue } = useSlider();
    const shiftRef = useRef(shiftPressed);


    const radius = 15;
    useEffect(() => {
        shiftRef.current = shiftPressed;
    }, [shiftPressed]);

    useEffect(() => {
        linkingNodeRef.current = linkingNode;
    }, [linkingNode]);

    useEffect(() => {
        currNodesNumRef.current = nodes.length;
        currShownNodesNumRef.current = nodes.filter(n => !n.hidden).length;
        const newLinks = processLinks(nodes);
        setLinks(newLinks);
    }, [nodes]);

    // Use Effects for SLides Node Resizing:

    useEffect(() => {
        // Update nodes sizes with slider
        const updatedNodes = nodes.map(node => {
            if (node.shape !== 'diamond') {
                return { ...node, size: sliderValue }; // Update size for non-diamond nodes
            }
            return node; // Keep diamond nodes unchanged
        });

        setNodes(updatedNodes);
    }, [sliderValue]); // Dependency on sliderValue 

    useEffect(() => {
        // Update nodes sizes with slider
        const updatedNodes = nodes.map(node => {
            if (node.shape !== 'diamond') {
                return { ...node, size: sliderValue }; // Update size for non-diamond nodes
            }
            return node; // Keep diamond nodes unchanged
        });

        setNodes(updatedNodes);
    }, [sliderValue]); // Dependency on sliderValue 

    useEffect(() => {
        // Update nodes sizes with slider
        const updatedNodes = nodes.map(node => {
            if (node.shape == 'aER') {
                return { ...node, size: aERSliderValue }; // Update size for non-diamond nodes
            }
            return node; // Keep diamond nodes unchanged
        });

        setNodes(updatedNodes);
    }, [aERSliderValue]); // Dependency on aERSliderValue

    useEffect(() => {
        // Update nodes sizes with slider
        const updatedNodes = nodes.map(node => {
            if (node.shape == 'iER') {
                return { ...node, size: iERSliderValue }; // Update size for non-diamond nodes
            }
            return node; // Keep diamond nodes unchanged
        });

        setNodes(updatedNodes);
    }, [iERSliderValue]); // Dependency on aERSliderValue

    useEffect(() => {
        // Update nodes sizes with slider
        const updatedNodes = nodes.map(node => {
            if (node.shape == 'rER') {
                return { ...node, size: rERSliderValue }; // Update size for non-diamond nodes
            }
            return node; // Keep diamond nodes unchanged
        });

        setNodes(updatedNodes);
    }, [rERSliderValue]); // Dependency on aERSliderValue

    useEffect(() => {
        // Update nodes sizes with slider
        const updatedNodes = nodes.map(node => {
            if (node.shape == 'Atomic ER') {
                return { ...node, size: atomicSliderValue }; // Update size for non-diamond nodes
            }
            return node; // Keep diamond nodes unchanged
        });

        setNodes(updatedNodes);
    }, [atomicSliderValue]); // Dependency on aERSliderValue

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
        if (event.key === 'Shift') {
            setShiftPressed(true)

        }

    };

    const handleKeyUp = (event) => {
        if (event.key === 'Shift') {
            setAnchorElMultiNode(event.currentTarget);
            setShiftPressed(false);

        }
    };

    const setComesAfterView = (node) => {
        const currCAProp = `comesAfter${filterType}`;
        node[currCAProp] = node.comesAfter;
    }

    useEffect(() => {

        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [nodes, links, selectedLink, selectedNode]);

    useEffect(() => {
        let loAlpha = 0;
        if ((Math.abs(prevNodesNumRef.current - currNodesNumRef.current) < 2) && (Math.abs(prevShownNodesNumRef.current - currShownNodesNumRef.current) < 5)) {
            loAlpha = 0.001;
        }
        else {
            loAlpha = 0.16;
        }
        const svg = d3.select(svgRef.current);
        height = svg.node().getBoundingClientRect().height * 0.9;
        width = svg.node().getBoundingClientRect().width * 0.9;

        const ticked = () => {

            svg.selectAll('.node')
                .attr('transform', d => `translate(${d.x},${d.y})`)
                .attr("cx", (d) => { return d.x = Math.max(radius, Math.min(width - 100 - radius, d.x)); })
                .attr("cy", (d) => { return d.y = Math.max(radius, Math.min(height - radius, d.y)); })
                .attr('visibility', d => d.hidden ? 'hidden' : 'visible');


            svg.selectAll('.nodeShape')
                .attr('d', d => getShapePath(d.shape)) // Update node shape path
                .attr('fill', d => d.color || color(d.type))
                .attr('transform', d => `scale(${getNodeScale(d.size)})`);

            svg.selectAll('.link')
                .attr("points", d => (d.source.fx || d.source.x) + "," + (d.source.fy || d.source.y) + " " +
                    ((d.source.fx || d.source.x) + (d.target.fx || d.target.x)) / 2 + "," + ((d.source.fy || d.source.y) + (d.target.fy || d.target.y)) / 2 + " " +
                    (d.target.fx || d.target.x) + "," + (d.target.fy || d.target.y))
                .style("stroke", d => {
                    switch (d.type) {
                        case 'Assesses':
                            return 'lightblue';
                        case 'Comes After':
                            return 'red';
                        case 'Is Part Of':
                            return 'grey';
                    }
                })
                .attr('visibility', d => (d.source.hidden || d.target.hidden) ? 'hidden' : 'visible')
                .lower(); // Move links below node shapes
            svg.selectAll('.markerDef')
                .attr('fill', d => {
                    switch (d.type) {
                        case 'Assesses':
                            return 'lightblue';
                        case 'Comes After':
                            return 'red';
                        case 'Is Part Of':
                            return 'grey';
                        default:
                            return '#df0d0d';
                    }
                })
                .attr('orient', d => {
                    switch (d.type) {
                        case 'Assesses':
                            return 'auto';
                        case 'Comes After':
                            return '1';
                        case 'Is Part Of':
                            return 'auto';
                        default:
                            return 'auto';
                    }
                }); // for correcting the orientation of the marker

            svg.selectAll('.nodeLabel')
                .text(d => d.name) // Update node's label text
                .attr('style', 'font-weight: bold; font-size: 8px;')


            // ** WIP ** 
            const distance = 10;
            svg.selectAll('.edgepath').attr('d', (d) => {
                let x1 = d.source.x - (distance * Math.sin(Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x)));
                let y1 = d.source.y + (distance * Math.cos(Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x)));
                let x2 = d.target.x - (distance * Math.sin(Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x)));
                let y2 = d.target.y + (distance * Math.cos(Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x)));
                return `M ${x1} ${y1} L ${x2} ${y2}`
            });

            svg.selectAll('.edgelabel').attr('transform', function (d) {

                let x = (d.source.x + d.target.x) / 2;
                let y = (d.source.y + d.target.y) / 2;
                return 'rotate( ' + (d.source.x > d.target.x ? 180 : 0) + ', ' + x + ', ' + y + ')';

            }).attr('visibility', (d) => (labelsToggled && !d.source.hidden && !d.target.hidden) ? 'visible' : 'hidden');
        };

        // Create a zoom behavior

        const zoom = d3.zoom()
            .scaleExtent([0.5, 5]) // Set the zoom scale limits
            .on('zoom', (event) => {
                svg.select('#main').attr('transform', event.transform);
                svg.call(function (d) {
                    svg.style("cursor", "grabbing");
                });
            })
            .on('end', () => {
                const recenterButton = document.getElementById('recenterButton');
                recenterButton.addEventListener('click', () => {
                    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
                });
                svg.call(function (d) {
                    svg.style("cursor", "default");
                });
            });
        svg.call(zoom);


        // Function to create a force that keeps nodes at a fixed vertical position
        const verticalForce = (nodes, strength) => {
            return (alpha) => {
                nodes.forEach(node => {
                    if (node.comesAfter !== null && node.comesAfter !== undefined) {
                        // Apply vertical force to nodes with comesAfter property
                        node.vy -= strength * (node.y - height / 2) * alpha; // Adjust to pull nodes to vertical center
                    }
                });
            };
        };
        // todo: filter based on ER type and selected view/FilterType (maybe eligibilty function type switching)
        // maybe also add ids to links so u kno which ones to keep -- might have to change the way links are stored (temporary view ones and permanent ones)
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links.filter(l => !l.hidden)).id(d => d.id).distance(100)) // Link force
            // .force('charge', d3.forceManyBody().strength(-1000).distanceMax(175).distanceMin(0.01)) // Charge force to repel nodes
            .force('charge', d3.forceCollide().radius(42.5).strength(filterType === '1' ? 0.01 : 1)) // Charge force to repel nodes
            .force('center', d3.forceCenter(width / 2, height / 2)) // Centering force
            .force('y', verticalForce(nodes, 1)) // Custom vertical force
            .on('tick', ticked);


        const defaultMarkers = [{ type: 'Assesses', source: { id: -1 }, target: { id: -1 } }, { type: 'Comes After', source: { id: -2 }, target: { id: -2 } }, { type: 'Is Part Of', source: { id: -3 }, target: { id: -3 } }]
        const marker = svg.select("defs")
            .selectAll(".markerDef")
            // Assign a marker per link, instead of one per class.
            .data(() => { let tmp = links.filter(l => !l.hidden); tmp.push(...defaultMarkers); return tmp }, function (d) { return d.source.id + "-" + d.target.id; });
        marker.exit().remove();
        const markerEnter = marker
            .enter()
            .append("marker")
            .attr("class", "markerDef")
            .merge(marker)
            .style("fill", d => {
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
            }) // Color the marker based on the link type
            // Markers are IDed by link source and target's name.
            // Spaces stripped because id can't have spaces.
            .attr("id", function (d) { return (d.source.id + "-" + d.target.id).replace(/\s+/g, ''); })
            // Since each marker is using the same data as each path, its attributes can similarly be modified.
            // Assuming you have a "value" property in each link object, you can manipulate the opacity of a marker just like a path.
            .style("opacity", function (d) { return Math.min(d.value, 1); })
            .attr("viewBox", "0 -5 10 10")
            // refX and refY are set to 0 since we will use the radius property of the target node later on, not here.
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .attr("xoverflow", "visible")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");

        const legendRect = svg.select('#legend').select('rect')
            .attr('x', width - 330)
            .attr('y', height - 130)
            .attr('width', 200)
            .attr('height', 100)
            .style('fill', 'white')
            .style('opacity', 0.8)
            .style('stroke', 'lightgrey')
        const legendLinks = svg.select('#legend').selectAll('.linkLegend')
            .data(...[defaultMarkers])
        const legendText = svg.select('#legend').selectAll('text')
            .data(...[defaultMarkers])

        legendText.exit().remove();
        legendLinks.exit().remove();

        const legendLinksEnter = legendLinks.enter().append('polyline')
            .attr('class', 'linkLegend')
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
            .attr('points', (d, i) => {
                return `${width - 325},${height - 105 + (i * 20)} ${width - 255},${height - 105 + (i * 20)} ${width - 185},${height - 105 + (i * 20)}`
            })
            .attr("marker-mid", function (d) { return "url(#" + (d.source.id + "-" + d.target.id).replace(/\s+/g, '') + ")"; });

        const legendTextEnter = legendText.enter().append('text')
            .attr("x", width - 182)
            .attr("y", (d, i) => {
                return `${height - 103 + (i * 20)}`
            })
            .text((d) => d.type)
            .style('font-size', 9);
        const link = svg.select('#main').selectAll('.link')
            .data(links, d => `${d.source.id}-${d.target.id}`);

        link.exit().remove();

        const linkEnter = link.enter().append('polyline')
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
            })
            .attr("marker-mid", function (d) { return "url(#" + (d.source.id + "-" + d.target.id).replace(/\s+/g, '') + ")"; })

        const edgepaths = svg.select('#main').selectAll(".edgepath")
            .data(links.filter(l => !l.hidden), function (d) { return d ? `p${d.source.id}-${d.target.id}` : this.id });
        edgepaths.exit().remove();
        const edgPathEnter = edgepaths.enter()
            .append('path')
            .attr('class', 'edgepath')
            .attr('fill-opacity', 0)
            .attr('stroke-opacity', 0)
            .attr('id', (d, i) => 'edgepath' + i)
            .style("pointer-events", "none");


        const edgelabels = svg.select('#main').selectAll(".edgelabel")
            .data(links.filter(l => !l.hidden), function (d) { return d ? `l${d.source.id}-${d.target.id}` : this.id });
        edgelabels.exit().remove();
        const enterEdgLabels = edgelabels
            .enter()
            .append('text')
            .style("pointer-events", "none")
            .attr('class', 'edgelabel')
            .attr('id', (d, i) => 'edgelabel' + i)
            .attr('fill', '#aaa')
            .append('textPath')
            .attr('font-size', 9)
            .style('stroke', 'black')
            .style('stroke-width', 0.3)
            .attr('xlink:href', (d, i) => '#edgepath' + i)
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .attr("startOffset", "50%") // Adjust the startOffset value to move the edgeLabels further from the edgepath
            .text(d => d.type);

        const node = svg.select('#main').selectAll('.node')
            .data(nodes, d => d.id);


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

        simulation.nodes(nodes)
        simulation.force('link').links(links);
        simulation.alpha(loAlpha).restart(); // Use a lower alpha value to minimize layout disruptions
        prevNodesNumRef.current = currNodesNumRef.current;
        prevShownNodesNumRef.current = currShownNodesNumRef.current;
        if (shiftRef.current == false) {

            updateNodeBorders(selectedNode ? [selectedNode] : [0]); // Update node borders initially
        }
        else {
            updateNodeBorders(selectedNodes)
        }

        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.1).restart();
            if (!d.fixed) {
                d.fx = d.x;
                d.fy = d.y;
            }
            simulation.velocityDecay(0.7); // reduce jiterriness
            simulation.force('center').strength(0.1);
        }

        function dragged(event, d) {
            if (!d.fixed) {
                d.fx = event.x;
                d.fy = event.y;
            }
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0.001);
            if (!d.fixed) {
                d.fx = null;
                d.fy = null;
            }
            setTimeout(() => {
                simulation.force('center').strength(1); // Add centering force back
                simulation.velocityDecay(0.4);
            }, 50); // Delay reapplying velocity decay to prevent nodes from suddenly flying off
        }


        function linkClicked(event, d) {
            setSelectedLink(d);
            setSelectedNode(null); // Deselect node if a link is clicked
            setAnchorElLink(d); // Set anchor for link popover
            updateLinkBorders(d.id); // Update link borders

            // Deselect any previously clicked node
            // updateNodeBorders([]);

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
            svg.selectAll('.node').remove();
            svg.selectAll('.link').remove();
            svg.selectAll('.markerDef').remove();
            svg.selectAll('.edgepath').remove();
            svg.selectAll('.edgelabel').remove();
            simulation.stop(); // Stop simulation on component unmount
        };

    }, [links, legendToggled, labelsToggled]);

    const handleCloseNode = () => {
        setSelectedNode(null);
        setSelectedNodes([])
        setAnchorElNode(false);
        // if(shiftRef.current == false){
        // updateNodeBorders([]);
        // }
        setLinkingMessage('');
    };
    const handleCloseLink = () => {
        d3.selectAll('.link.clicked').classed('clicked', false);
        setSelectedLink(null);
        setAnchorElLink(false);
        updateLinkBorders(null);
        // updateNodeBorders([]);
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
        if (selectedNodes) {
            for (var i of selectedNodes) {
                i.shape = newShape;
                switch (newShape) {
                    case 'Atomic ER':
                        i.color = '#ADD8E6';
                        break;
                    case 'aER':
                        i.color = 'orange';
                        i.stroke = "black";

                        break;
                    case 'iER':
                        i.color = 'red';
                        i.stroke = "black";
                        break;
                    case 'rER':
                        i.color = 'green';
                        i.stroke = "black";
                        break;
                    default:
                        i.color = color('default');
                }
            }
            setNodes([...nodes]); // Trigger re-render to update node shape and color
        }


    };

    const handleSizeChange = (newSize) => {
        if (selectedNode) {
            selectedNode.size = newSize;
            setNodes([...nodes]); // Trigger re-render to update node size
            setAnchorElNode(selectedNode)
        }
        else if (selectedNodes && selectedNodes.length > 0) {
            for (var i of selectedNodes) {
                console.log(i)
                i.size = newSize
            }
            setNodes([...nodes]);

        }
    };
    const handleTypeChange = (newType) => {
        if (selectedLink) {
            switch (selectedLink.type) {
                case 'Assesses':
                    nodes.find(n => n.id === selectedLink.source.id).assesses = null;
                    break;
                case 'Comes After':
                    nodes.find(n => n.id === selectedLink.source.id).comesAfter = null;
                    break;
                case 'Is Part Of':
                    nodes.find(n => n.id === selectedLink.source.id).isPartOf = null;
                    break;
            }
            switch (newType) {
                case 'Assesses':
                    nodes.find(n => n.id === selectedLink.source.id).assesses = selectedLink.target.id;
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
        const maxIdNode = nodes.filter(n => n.id !== 54321).reduce((maxNode, node) => (node.id > maxNode.id) ? node : maxNode, nodes[0]);
        const id = maxIdNode.id + 1;
        const name = `ER ${id}`;
        const newNode = { id, name, shape: 'Atomic ER', size: 7, color: '#ADD8E6', x: width / 2, y: height / 2, assesses: null, isPartOf: null, comesAfter: null };
        setNodes([...nodes, newNode]);
        // setLinks([...links]);

    };

    const handleRemoveNode = () => {
        if (selectedNode) {
            const nodeId = selectedNode.id;
            setNodes(nodes.filter(n => n.id !== nodeId));
            // setLinks(links.filter(l => l.source.id !== nodeId && l.target.id !== nodeId));
            setSelectedNode(null);
        }
        else if (selectedNodes) {
            const selectedIds = selectedNodes.map(n => n.id);
            setNodes(nodes.filter(n => !selectedIds.includes(n.id)));

        }


        else {
            setLinkingMessage('Select a node to delete');
            setTimeout(() => setLinkingMessage(''), 2000); // Clear the message after 2 seconds
        }
    };

    function nodeClicked(event, d) {
        if (shiftRef.current) {
            setSelectedNodes(prevNodes => {
                const newNodes = [...prevNodes, d];

                //  Show popover if more than one node is selected
                if (newNodes.length > 1 && shiftRef.current == false) {
                    setAnchorElMultiNode(event.currentTarget); // Set the popover anchor to the event target
                } else {
                    setAnchorElMultiNode(null); // Hide popover if only one node is selected
                }

                updateNodeBorders(newNodes);
                return newNodes;
            });
        }
        else {
            setSelectedNodes([]);
            const currLN = linkingNodeRef.current;

            if (currLN && currLN.id !== d.id) {
                const existingLink = links.find(link =>
                    (link.source.id === currLN.id && link.target.id === d.id) ||
                    (link.source.id === d.id && link.target.id === currLN.id)
                );
                // const cLN = nodes.find(n => n.id === currentLinkingNode.id)
                if (!existingLink) {
                    currLN.comesAfter = d.id

                    setNodes([...nodes]);
                    // setLinks(prevLinks => [...prevLinks, { source: currentLinkingNode, target: d, type: 'Comes After' }]);
                }

                setLinkingNode(null);
                setLinkingMessage('');

            } else {
                setSelectedNode(d);
                setSelectedLink(null); // Deselect link if a node is clicked
                setAnchorElNode(d); // Set anchor for node popover
                updateNodeBorders([d]); // Add this line to update node borders

                // Deselect any previously clicked link
                d3.selectAll('.link.clicked').classed('clicked', false);
            }
        }
    }
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    parseCSV(text);
                } catch (error) {
                    // Display error popup
                    setIsAlertError(true);
                    //set back to false after 5 seconds
                    setTimeout(() => setIsAlertError(false), 5000);
                }
            };
            reader.readAsText(file);
        }
    };

    const parseCSV = (data) => {
        let parsedData = d3.csvParse(data, ({ identifier, title, description, url, type, isPartOf, isFormatOf, assesses, comesAfter }) => {
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
            return node
        })

        //   Remove nodes with title "start" or "end" (case insensitive)
        parsedData = parsedData.filter(node => {
            const title = node.name ? node.name.toLowerCase() : '';
            return title !== 'start' && title !== 'end';
        });


        const countIERNodes = parsedData.filter(node => node.shape === 'iER').length;
        let cnt = 0;
        let tmpID = -5
        parsedData.forEach((node, index) => {
            if (node.shape === 'iER') {
                cnt++;
                tmpID = node.id;
                node.fixed = true;
                node.fy = height / 2;
                node.fx = (cnt * (width / countIERNodes)) - (width * 0.2);
            }
            // else if (node.isPartOf === tmpID) {
            //     // node.x = (cnt * (width / countIERNodes)) - (radius * 2);
            //     node.y = height / 2 + (((Math.random() * 2) - 1) * (height / 2));
            // }
        });
        const filteredNodes = parsedData.filter(node => node.shape === 'iER');
        let maxIdNode = filteredNodes.reduce((maxNode, node) => node.id > maxNode.id ? node : maxNode, filteredNodes[0]);
        let minIdNode = filteredNodes.reduce((minNode, node) => node.id < minNode.id ? node : minNode, filteredNodes[0]);
        const tmpNodes = nodes.filter(n => (n.id === 54321) || (n.id === 0)).forEach(node => { // add only start and end
            if (node.id === 54321) {
                const updEnd = {
                    ...node,
                    comesAfter: maxIdNode.id
                }
                parsedData.push(updEnd);
            }
            else if (node.id === 0) {
                parsedData.find(n => n.id === minIdNode.id).comesAfter = 0;
                parsedData.push(node)
            };
            return node

        })

        parsedData.forEach(node => setComesAfterView(node));
        setNodes(parsedData);
        // setLinks(newLinks);
    };

    const processLinks = (parsedData) => {
        const newLinks = [];
        parsedData.forEach(node => {
            if (typeof node.isPartOf == 'number') {
                const targetNode = parsedData.find(n => n.id === node.isPartOf);
                if (targetNode) {
                    newLinks.push({ source: node.id, target: targetNode.id, type: 'Is Part Of' });
                }
            }
            if (typeof node.assesses == 'number') {
                const targetNode = parsedData.find(n => n.id === node.assesses);
                if (targetNode) {
                    newLinks.push({ source: node.id, target: targetNode.id, type: 'Assesses' });
                }
            }
            if (typeof node.comesAfter == 'number') {
                const targetNode = parsedData.find(n => n.id === node.comesAfter);
                if (targetNode) {
                    newLinks.push({ source: node.id, target: targetNode.id, type: 'Comes After' });
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
            switch (selectedLink.type) {
                case "Assesses":
                    selectedLink.source.assesses = null;
                case "Comes After":
                    selectedLink.source.comesAfter = null;
                case "Is Part Of":
                    selectedLink.source.isPartOf = null;
            }
            // ?setLinks(links.filter(l => l !== selectedLink));
            setSelectedLink(null);
            setNodes([...nodes]);
        } else {
            setLinkingMessage('Select a link to delete');
            setTimeout(() => setLinkingMessage(''), 2000); // Clear the message after 2 seconds
        }
    };

    const handleFilterNodes = (filterType) => {
        // Update nodes with hidden property based on filterType
        const currCA = `comesAfter${filterType}`
        switch (filterType) {
            case "1":
                const aERNodes = nodes.filter(node => node.shape === 'aER');
                // connect all aER, start and end nodes with comesAfter property (ascending ID order)
                const filteredNodes = aERNodes.sort((a, b) => b.id - a.id);
                const lastNode = nodes.find(n => n.id === 54321)
                filteredNodes.forEach((node, index) => {
                    if (index === 0) {
                        lastNode.comesAfter = node.id; // connect end node
                        lastNode[currCA] = node.id; // connect end node
                        node.comesAfter = filteredNodes[index + 1].id;
                        node[currCA] = filteredNodes[index + 1].id;
                    }
                    else if (index === filteredNodes.length - 1) {
                        node.comesAfter = 0; // connect start node
                        node[currCA] = 0; // connect start node
                    }
                    else {
                        node.comesAfter = filteredNodes[index + 1].id;
                        node[currCA] = filteredNodes[index + 1].id;
                    }
                    node.fy = height / 2;
                });
                break;
            case "2":
                break;
            case "3":
            case "4":
            default:
                nodes.filter(node => node.shape === 'aER').forEach((node, index) => { node.fy = null });
                nodes.forEach(node => node.comesAfter = node.comesAfter3);
                break;


        }
        const updatedNodes = nodes.map(node => {
            let hidden = false;
            if (node.id === 0 || node.id === 54321) {
                hidden = false; // Always show nodes with id 1 and 2
            }
            else {
                switch (filterType) {
                    case "1":
                        hidden = !(node.shape === 'aER' || node.shape === 'rER');
                        break;
                    case "2":
                        hidden = node.shape == 'Atomic ER';
                        break;
                    case "3":
                    case "4":
                        hidden = false; // Show all nodes
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

    };


    const updateNodeBorders = (selected) => {
        if (shiftRef.current == true) {
            // Apply black stroke to all selected nodes
            const selectedNodeIds = Object.values(selected).map(node => node.id);
            console.log(selectedNodeIds)
            d3.select(svgRef.current).selectAll('.nodeShape')
                .attr('stroke', d => (selectedNodeIds.includes(d.id) ? 'black' : 'none'))
                .attr('stroke-width', '0.5');
        }
        if (shiftRef.current == false && selected.length > 0) {
            const selectedNodeId = selected[0].id
            d3.select(svgRef.current).selectAll('.nodeShape')
                .attr('stroke', d => (d.id === selectedNodeId ? 'black' : 'none'))
                .attr('stroke-width', d => (d.id === selectedNodeId ? 0.5 : 0));
        }
    }


    const updateLinkBorders = (selectedLinkId) => {
        d3.select(svgRef.current).selectAll('.link')
            .attr('stroke', d => (d === selectedLinkId ? 'black' : '#df0d0d'))
            .attr('stroke-width', d => (d === selectedLinkId ? 5 : 3))
            .classed('clicked', d => d === selectedLinkId);
    }

    function downloadCSV() {
        let csvContent = "ID,name,alternative title,target URL,type,isPartOf,assesses,comesAfter\n";
        nodes.forEach(node => {
            if (node.alternativeTitle == undefined) {
                node.alternativeTitle = ""
            }
            if (node.targetURL == undefined) {
                node.targetURL = ""
            }
            csvContent += `${node.id},${node.name},${node.alternativeTitle},${node.targetURL},${node.type},${node.isPartOf || ""},${node.assesses || ""},${node.comesAfter || ""}\n`;
        });

        let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        let link = document.createElement("a");
        if (link.download !== undefined) {
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "network_data.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function handleExportClick() {
        exportSvg(svgRef.current, 'my-d3-graph.svg');
    };

    return (
        <div>
            <div className='navbar'>
                <Navbar onExportClick={handleExportClick} onDownloadCSV={downloadCSV} />
                <div className='buttons'>
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
                    <Button onClick={handleAddNode} startIcon={<Add />} variant="outlined">Add ER</Button>
                    <Button id='recenterButton' variant="outlined">Recenter</Button>
                    <FormControlLabel sx={{ marginLeft: '2px' }}
                        control={<Switch size="small" checked={labelsToggled} onChange={() => setLabelsToggled(!labelsToggled)} />}
                        label={`${labelsToggled ? 'Hide' : 'Show'} Labels`}
                    />
                    <FormControlLabel sx={{ marginLeft: '2px' }}
                        control={<Switch size="small" checked={legendToggled} onChange={() => setLegendToggled(!legendToggled)} />}
                        label={`${legendToggled ? 'Hide' : 'Show'} Legend`}
                    />
                </div>
                {/* <Button onClick={handleRemoveNode} startIcon={<Remove />} variant="outlined">Remove Node</Button> */}

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
            </div>            <svg ref={svgRef} width='100%' height='100%' viewBox={`0 0 ${width} ${height}`}>
                <g id='main'>
                </g>
                {legendToggled && (<g id='legend'><rect></rect></g>)}
                <defs></defs>
            </svg>
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
                // console.log(anchorElNode),
                <NodePopover
                    id="node-popover"
                    open={Boolean(anchorElNode)}
                    anchorEl={anchorElNode}
                    onClose={handleCloseNode}
                    handleAddLink={handleAddLink}
                    selectedNode={selectedNode}
                    selectedNodes={[]}
                    handleShapeChange={handleShapeChange}
                    handleSizeChange={handleSizeChange}
                    handleRenameNode={handleRenameNode}
                    handleRemoveNode={handleRemoveNode}
                />
            )}

            {selectedNodes && (
                //  console.log(anchorElMultiNode),
                <NodePopover
                    id="node-popover"
                    open={Boolean(anchorElMultiNode)}
                    anchorEl={anchorElMultiNode}
                    onClose={handleCloseNode}
                    handleAddLink={handleAddLink}
                    selectedNode={""}
                    selectedNodes={selectedNodes}
                    handleShapeChange={handleShapeChange}
                    handleSizeChange={handleSizeChange}
                    handleRemoveNode={handleRemoveNode}
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
            {isAlertError && <Alert icon={<ErrorOutline fontSize="inherit" />} severity="error">
                There was an error processing the file. Please try again.
            </Alert>}
        </div>
    );
};

export default NetworkGraph;
