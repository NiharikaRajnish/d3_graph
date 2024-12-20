import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, FormGroup, LinearProgress, Slide, Stack, Switch, Typography } from '@mui/material';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, ErrorOutline, Visibility, Undo as UndoIcon, Redo as RedoIcon } from '@mui/icons-material';
import NodePopover from './NodePopover';
import LinkPopover from './LinkPopover';
import Navbar from './Navbar';
import { useSlider } from './SliderContext';
import exportSvg from './ExportSvg'; // Import the function
import { CgTrashEmpty } from 'react-icons/cg';
import { SiPurescript } from 'react-icons/si';
import * as _ from 'lodash';

const NetworkGraph = () => {
    // let width = window.innerWidth * 0.9,
    //     height = window.innerHeight * 0.8;
    const initW = localStorage.getItem('width') ? JSON.parse(localStorage.getItem('width')) : window.innerWidth * 0.9,
        initH = localStorage.getItem('height') ? JSON.parse(localStorage.getItem('height')) : window.innerHeight * 0.85;
    const initialNodes = [
        { id: 0, name: 'start', type: 'start', shape: 'diamond', size: 10, color: 'green', fx: 50, fy: initH / 2, fixed: true, assesses: null, isPartOf: null, comesAfter: null }, // Fixed position for start node
        { id: 54321, name: 'end', type: 'end', shape: 'diamond', size: 10, color: 'green', fx: initW - 50, fy: initH / 2, fixed: true, assesses: null, isPartOf: null, comesAfter: null } // Fixed position for end node
    ];
    const initialLinks = [];
    const originalIdRef = useRef(null);
    const originalComesAfterRef = useRef(null);
    const originalIsPartOfRef = useRef(null);


    const [nodes, setNodes] = useState(localStorage.getItem('nodes3') ? JSON.parse(localStorage.getItem('nodes3')) : initialNodes);
    const [links, setLinks] = useState(initialLinks);
    const [selectedNode, setSelectedNode] = useState(null);
    const [shiftPressed, setShiftPressed] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState([0]);
    const [selectedLink, setSelectedLink] = useState(null);
    const [width, setWidth] = useState(initW);
    const [height, setHeight] = useState(initH);
    const [anchorElNode, setAnchorElNode] = useState(null);
    const [anchorElMultiNode, setAnchorElMultiNode] = useState(null);
    const [anchorElLink, setAnchorElLink] = useState(null);
    const [linkingNode, setLinkingNode] = useState(null);
    const [legendToggled, setLegendToggled] = useState(false);
    const [labelsToggled, setLabelsToggled] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogOpen2, setDialogOpen2] = useState(false);
    const [linkingMessage, setLinkingMessage] = useState('');
    const [filterType, setFilterType] = useState('3');
    const [isAlertError, setIsAlertError] = useState(false);
    const [redoHistory, setRedoHistory] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false); // Track collapse state
    const [history, setHistory] = useState([]); // Stores previous states for undo
    const currNodesNumRef = useRef(0);
    const currShownNodesNumRef = useRef(0);
    const prevNodesNumRef = useRef(0);
    const prevShownNodesNumRef = useRef(0);
    const svgRef = useRef(null);
    const progressRef = useRef(null);
    const color = d3.scaleSequential(d3.interpolateOranges);
    const linkingNodeRef = useRef(linkingNode);
    const { sliderValue, setSliderValue, aERSliderValue, setaERSliderValue, iERSliderValue, setIERSliderValue, rERSliderValue, setrERSliderValue, atomicSliderValue, setatomicSliderValue } = useSlider();
    const shiftRef = useRef(shiftPressed);
    const fileInputRef = useRef(null); // Use ref to trigger file input


    const radius = 15;
    // useEffect(() => {
    //     const handleResize = (event) => {
    //         let widthOld = width
    //         width = window.innerWidth * 0.9
    //         let heightOld = height
    //         height = window.innerHeight * 0.9
    //         const oldNewWRatio = width / widthOld
    //         const oldNewHRatio = height / heightOld
    //         nodes.forEach((n) => {
    //             if (n.shape !== 'diamond') {
    //                 n.fx = oldNewWRatio * n.fx
    //                 n.fy = oldNewHRatio * n.fy
    //             }
    //         })
    //         setNodes([...nodes])
    //     };
    //     window.addEventListener("resize", handleResize);
    //     // localStorage.clear();
    //     // localStorage.getItem('nodes3') && setNodes(loadNodesFromLocalStorage('3'));
    //     return () => window.removeEventListener("resize", handleResize);
    // }, []);

    useEffect(() => {
        shiftRef.current = shiftPressed;
    }, [shiftPressed]);

    useEffect(() => {
        linkingNodeRef.current = linkingNode;
    }, [linkingNode]);

    useEffect(() => {
        currNodesNumRef.current = nodes.length;
        currShownNodesNumRef.current = nodes.filter(n => !n.hidden).length;
        localStorage.setItem('width', width)
        localStorage.setItem('height', height)
        const newLinks = processLinks(nodes);
        setLinks(newLinks);
        // updateSavedNodes();
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
        } else if (event.code === 'KeyA' && event.shiftKey) {
            setSelectedNodes([...nodes]);
            updateNodeBorders([...nodes]);
        } else if (event.key === 'Shift') {
            setShiftPressed(true)
        }
    };

    const handleKeyUp = (event) => {
        if (event.key === 'Shift') {
            setAnchorElMultiNode(event.currentTarget);
            setShiftPressed(false);

        }
    };

    const saveToHistory = (action, payload) => {
        setHistory(prev => [...prev, { action, payload }]);
    };

    useEffect(() => {

        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [links, selectedLink, selectedNode]);

    useEffect(() => {
        const diffOldNew = difference(loadNodesFromLocalStorage(filterType), nodes)
        let loAlpha = diffOldNew.length > 0 ? 0.16 : 0.005;
        // if ((Math.abs(prevShownNodesNumRef.current - currShownNodesNumRef.current) < 2)) {
        //     loAlpha = 0.005;
        // }
        // else {
        //     loAlpha = 0.16;
        // }
        const svg = d3.select(svgRef.current);
        // height = svg.node().getBoundingClientRect().height * 0.9;
        // width = svg.node().getBoundingClientRect().width * 0.9;
        let cntr = 0;
        const ticked = () => {
            if (cntr === 0) {
                progressRef.current.style.visibility = 'visible';
            }
            cntr++;
            svg.selectAll('.node')
                .attr('transform', d => `translate(${d.fx || d.x},${d.fy || d.y})`)
                .attr("cx", (d) => { return d.x = Math.max(radius, Math.min(width - 100 - radius, d.x)); })
                .attr("cy", (d) => { return d.y = Math.max(radius + 100, Math.min(height - 100 - radius, d.y)); })
                .attr('visibility', d => d.hidden ? 'hidden' : 'visible');


            svg.selectAll('.nodeShape')
                .attr('d', d => getShapePath(d.shape)) // Update node shape path
                .attr('fill', d => {
                    switch (d.shape) {
                        case 'Atomic ER':
                            return '#fda660';
                        case 'aER':
                            return '#1f77b4';
                        case 'iER':
                            return '#2ca02c';
                        case 'rER':
                            return '#7f7f7f';
                        case 'diamond':
                            return 'green';
                        default:
                            return '#fda660';
                    }
                })
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
                    if (node.comesAfter !== null && node.comesAfter !== undefined && nodes.find(n => n.comesAfter === node.id)) {
                        // Apply vertical force to nodes with comesAfter property
                        node.vy -= strength * (node.y - (height / 2)) * alpha; // Adjust to pull nodes to vertical center
                    } else {
                        node.vy += strength * (node.y - (height / 2)) * alpha * (filterType === '1' ? 1 : 0.25);
                    }
                });
            };
        };
        // todo: filter based on ER type and selected view/FilterType (maybe eligibilty function type switching)
        // maybe also add ids to links so u kno which ones to keep -- might have to change the way links are stored (temporary view ones and permanent ones)
        const simulation = d3.forceSimulation(nodes.filter(n => !n.hidden))
            .force('link', d3.forceLink(links.filter(l => !l.hidden)).id(d => d.id).distance(75)) // Link force
            .force('chargeMB', d3.forceManyBody().strength(-1000).distanceMax(150).distanceMin(0.01)) // Charge force to repel nodes
            .force('charge', d3.forceCollide().radius(42.5))
            .force('center', d3.forceCenter(width / 2, height / 2)) // Centering force
            .force('y', verticalForce(nodes, 1)) // Custom vertical force
            .on('tick', ticked)
            .on('end',
                () => {
                    let i = 0
                    nodes.forEach(d => {
                        if (!d.fixed) {
                            i++;
                            d.fy = Math.max(radius + 100, Math.min(height - 100 - radius, d.y));
                            d.fx = Math.max(radius, Math.min(width - 100 - radius, d.x));
                            d.fixed = true;
                        }
                    })
                    i > 0 && setNodes([...nodes])
                    saveNodesToLocalStorage(nodes, filterType);
                    progressRef.current.style.visibility = 'hidden';
                });


        const defaultMarkers = [{ type: 'Assesses', source: { id: -1 }, target: { id: -1 } }, { type: 'Comes After', source: { id: -2 }, target: { id: -2 } }, { type: 'Is Part Of', source: { id: -3 }, target: { id: -3 } }]
        const defaultShapes = [{ type: 'Atomic ER' }, { type: 'aER' }, { type: 'iER' }, { type: 'rER' }]
        const defaultShapesTxt = [{ type: 'Atomic ER' }, { type: 'Activity ER' }, { type: 'Instructional ER' }, { type: 'Rubric ER' }]
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
            .attr("viewBox", d => d.type === 'Comes After' ? "-10 -5 10 10" : "0 -5 10 10")
            // refX and refY are set to 0 since we will use the radius property of the target node later on, not here.
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .attr("xoverflow", "visible")
            .append("path")
            .attr("d", (d) => d.type === 'Comes After' ? "M0,-5L-10,0L0,5" : "M0,-5L10,0L0,5");

        const legendRect = svg.select('#legend').select('rect')
            .attr('x', width - 230)
            .attr('y', height - 320)
            .attr('width', 200)
            .attr('height', 200)
            .style('fill', 'white')
            .style('opacity', 0.8)
            .style('stroke', 'lightgrey')
        const legendLinks = svg.select('#legend').selectAll('.linkLegend')
            .data(...[defaultMarkers])
        const legendLinksText = svg.select('#legend').selectAll('.linkLegendText')
            .data(...[defaultMarkers])
        const legendERs = svg.select('#legend').selectAll('.erLegend')
            .data(...[defaultShapes])
        const legendERsText = svg.select('#legend').selectAll('.erLegendText')
            .data(...[defaultShapesTxt])

        legendLinksText.exit().remove();
        legendLinks.exit().remove();
        legendERsText.exit().remove();
        legendERs.exit().remove();

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
                return `${width - 200},${height - 295 + (i * 20)} ${width - 155},${height - 295 + (i * 20)} ${width - 110},${height - 295 + (i * 20)}`
            })
            .attr("marker-mid", function (d) { return "url(#" + (d.source.id + "-" + d.target.id).replace(/\s+/g, '') + ")"; });

        const legendTextEnter = legendLinksText.enter().append('text')
            .attr('class', 'linkLegendText')
            .attr("x", width - 105)
            .attr("y", (d, i) => {
                return `${height - 293 + (i * 20)}`
            })
            .text((d) => d.type)
            .style('font-size', 10);

        const legendERsEnter = legendERs.enter().append('path')
            .attr('class', 'erLegend')
            .attr('d', d => getShapePath(d.type))
            .attr('fill', d => {
                switch (d.type) {
                    case 'Atomic ER':
                        return '#ff7f0e';
                    case 'aER':
                        return '#1f77b4';
                    case 'iER':
                        return '#2ca02c';
                    case 'rER':
                        return '#7f7f7f';
                    case 'diamond':
                            return 'green';
                    default:
                        return '#fda660';
                }
            })
            .attr('transform', (d, i) => {
                return `translate(${width - 155},${height - 230 + (i * 32)}) scale(${getNodeScale(2)})`
            })


        const legendERsTextEnter = legendERsText.enter().append('text')
            .attr('class', 'erLegendText')
            .attr("x", width - 105)
            .attr("y", (d, i) => {
                return `${height - 227 + (i * 32)}`
            })
            .text((d) => d.type)
            .style('font-size', 10);

        const link = svg.select('#main').selectAll('.link')
            .data(links.filter(l => !l.hidden), d => `${d.source.id}-${d.target.id}`);

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
            .attr('fill', d => {
                switch (d.shape) {
                    case 'Atomic ER':
                        return '#ff7f0e';
                    case 'aER':
                        return '#1f77b4';
                    case 'iER':
                        return '#2ca02c';
                    case 'rER':
                        return '#7f7f7f';
                    case 'diamond':
                        return 'green';
                    default:
                        return '#fda660';
                }
            })
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

        simulation.alpha(loAlpha).restart(); // Use a lower alpha value to minimize layout disruptions
        prevNodesNumRef.current = currNodesNumRef.current;
        prevShownNodesNumRef.current = currShownNodesNumRef.current;
        if (shiftRef.current == false && selectedNodes.length < 2) {

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
            // nodes.forEach(n => { n.fx = n.x; n.fy = n.y; });
            simulation.velocityDecay(0.7); // reduce jiterriness
            simulation.force('center').strength(0.1);
        }

        function dragged(event, d) {
            if (d.type !== 'start' && d.type !== 'end') {
                d.fx = event.x;
                d.fy = event.y;
            }
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            if (!d.fixed) {
                d.fx = null;
                d.fy = null;
            } else if (d.type !== 'start' && d.type !== 'end') {
                d.fx = Math.max(radius, Math.min(width - 100 - radius, d.fx));
                d.fy = Math.max(radius + 100, Math.min(height - 100 - radius, d.fy));
            }
            setTimeout(() => {
                simulation.force('center').strength(1); // Add centering force back
                simulation.velocityDecay(0.4);
                saveNodesToLocalStorage(nodes, filterType);
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

            // Save the current shape and color of the selected node to history
            saveToHistory('changeShape', {
                nodeId: selectedNode.id,
                originalShape: selectedNode.shape, // Save the original shape
                originalColor: selectedNode.color  // Save the original color
            });



            selectedNode.shape = newShape;
            switch (newShape) {
                case 'Atomic ER':
                    selectedNode.color = '#fda660';
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
                case 'diamond':
                        return 'green';
                default:
                    selectedNode.color = color('default');
            }
            setNodes([...nodes]); // Trigger re-render to update node shape and color
            // setLinks([...links]);
        }
        if (selectedNodes && selectedNodes.length > 0) {
            // Save the original shapes and colors of selected nodes for undo
            const originalShapes = selectedNodes.map(node => ({
                id: node.id,
                shape: node.shape,
                color: node.color,
            }));

            saveToHistory('changeMultipleShapes', { originalShapes });
            for (var i of selectedNodes) {
                if (i != 0) {
                    i.shape = newShape;
                    switch (newShape) {
                        case 'Atomic ER':
                            i.color = '#fda660';
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
            }
            setNodes([...nodes]); // Trigger re-render to update node shape and color
        }
        updateSavedNodes();
        setSelectedNodes([]); // This clears the selected nodes
        setSelectedNodes([]); // This clears the selected nodes

    };

    const handleSizeChange = (newSize) => {
        if (selectedNode) {
            // Save the current size of the node for undo purposes
            saveToHistory('changeSize', {
                nodeId: selectedNode.id,
                originalSize: selectedNode.size // Save the original size before changing
            });

            selectedNode.size = newSize;
            setNodes([...nodes]); // Trigger re-render to update node size
            setAnchorElNode(selectedNode)
        }
        else if (selectedNodes && selectedNodes.length > 0) {
            // Save the original sizes of the selected nodes for undo
            const originalSizes = selectedNodes.map(node => ({
                id: node.id,
                size: node.size // Save each node's original size before changing
            }));
            saveToHistory('changeMultipleSizes', { originalSizes });

            for (var i of selectedNodes) {
                if (i != 0) {
                    i.size = newSize
                }
            }
            setNodes([...nodes]);

        }
        updateSavedNodes();
    };
    const handleTypeChange = (newType) => {

        if (selectedLink) {
            // Save the current link type to the history for undo purposes
            saveToHistory('changeLinkType', {
                linkId: selectedLink.id,
                originalType: selectedLink.type, // Save the original type
            });
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
            updateSavedNodes();
        }
    };

    const handleRenameNode = (newName) => {
        if (selectedNode) {
            selectedNode.name = newName;
            setNodes([...nodes]); // Trigger re-render to update node name
            updateSavedNodes();
        }
    };

    const handleAddNode = () => {
        const maxIdNode = nodes.filter(n => n.id !== 54321).reduce((maxNode, node) => (node.id > maxNode.id) ? node : maxNode, nodes[0]);
        const id = maxIdNode.id + 1;
        const name = `ER ${id}`;
        const newNode = { id, name, shape: 'Atomic ER', size: 7, color: '#fda660', x: width / 2, y: height / 2, assesses: null, isPartOf: null, comesAfter: null };
        setNodes([...nodes, newNode]);
        updateSavedNodes();
        saveToHistory('addNode', newNode);

    };

    const handleAutoLayout = () => {
        let nodesCopy = JSON.parse(JSON.stringify(nodes));
        nodesCopy = nodesCopy.filter(node => {
            const title = node.name ? node.name.toLowerCase() : '';
            return title !== 'start' && title !== 'end';
        });
        const aERNodes = nodesCopy.filter(node => node.shape === 'aER');
        const iERNodes = nodesCopy.filter(node => node.shape === 'iER');
        const includedIERs = filterType !== '1' ? iERNodes : []
        const includedAERs = filterType === '1' ? aERNodes : aERNodes.filter(n => (n.comesAfter || nodes.some(node => node.comesAfter === n.id)))
        const contERsStartEnd = [...includedIERs, ...includedAERs];
        const totalWidth = nodes.find(n => n.id === 54321).fx - nodes.find(n => n.id === 0).fx
        const remainingWidth = totalWidth - (70 * contERsStartEnd.length);
        const gapSize = remainingWidth / (contERsStartEnd.length + 1);
        let pos = 50;
        let allPositions = [];
        for (let i = 0; i < contERsStartEnd.length; i++) {
            pos = pos + 70 + gapSize;
            allPositions.push(pos)
        }
        let cntIER = 0
        let cntAER = 0
        for (let i = 0; i < contERsStartEnd.length; i++) {
            // alternate setting positions for iERs and aERs with iERs first
            if (i % 2 === 0) {
                if (includedIERs[cntIER]) {
                    includedIERs[cntIER].fx = allPositions[i]
                    includedIERs[cntIER].fy = height / 2
                    cntIER++
                } else if (includedAERs[cntAER]) {
                    includedAERs[cntAER].fx = allPositions[i]
                    includedAERs[cntAER].fy = height / 2
                    cntAER++
                }
            } else {
                if (includedAERs[cntAER]) {
                    includedAERs[cntAER].fx = allPositions[i]
                    includedAERs[cntAER].fy = height / 2
                    cntAER++
                } else if (includedIERs[cntIER]) {
                    includedIERs[cntIER].fx = allPositions[i]
                    includedIERs[cntIER].fy = height / 2
                    cntIER++
                }
            }
        }
        let cnt = 0;
        nodesCopy.forEach((node, index) => {
            if (contERsStartEnd.some(n => n.id === node.id)) {
                node.fixed = true;
            }
            else {
                node.fixed = false;
                node.fx = null;
                node.fy = null;
            }
        });
        // filter 'iER' nodes then get the average fx position between each consecutive iER node pairs
        // const avgFXs = []
        // for (let i = 0; i < contERsStartEnd.length - 1; i++) {
        //     const iER1 = contERsStartEnd[i];
        //     const iER2 = contERsStartEnd[i + 1];
        //     avgFXs.push((iER1.fx + iER2.fx) / 2);
        // }
        // for (let i = 0; i < aERNodes.length; i++) {
        //     aERNodes[i].fx = !aERNodes[i].fx ? avgFXs[i] : aERNodes[i].fx;
        // }
        const maxIdNode = iERNodes.reduce((maxNode, node) => node.id > maxNode.id ? node : maxNode, iERNodes[0]);
        const maxIdNodeAER = aERNodes.reduce((maxNode, node) => node.id > maxNode.id ? node : maxNode, aERNodes[0]);
        const minIdNode = iERNodes.reduce((minNode, node) => node.id < minNode.id ? node : minNode, iERNodes[0]);
        const minIdNodeAER = aERNodes.reduce((minNode, node) => node.id < minNode.id ? node : minNode, aERNodes[0]);
        const tmpNodes = nodes.filter(n => (n.id === 54321) || (n.id === 0)).forEach(node => { // add only start and end
            if (node.id === 54321) {
                const updEnd = {
                    ...node,
                    fy: height / 2,
                    fx: width - 50,
                }
                if (filterType === '1 ' && maxIdNodeAER) {
                    node.comesAfter = maxIdNodeAER.id;
                } else if (filterType !== '1' && maxIdNode) {
                    node.comesAfter = maxIdNode.id;
                }
                nodesCopy.push(updEnd);
            }
            else if (node.id === 0) {
                node.fy = height / 2;
                if (filterType === '1 ' && minIdNodeAER) {
                    nodesCopy.find(n => n.id === (minIdNodeAER.id)).comesAfter = 0;
                } else if (filterType !== '1' && minIdNode) {
                    nodesCopy.find(n => n.id === (minIdNode.id)).comesAfter = 0;
                }
                nodesCopy.push(node)
            };
            return node

        })
        setNodes(nodesCopy)
    };

    const handleClear = (yn) => {
        if (yn) {
            setHistory([]);
            setRedoHistory([]);
            localStorage.clear();
            let strtEndNodes = nodes.filter(n => (n.id === 54321) || (n.id === 0)),
                currH = window.innerHeight * 0.9,
                currW = window.innerWidth * 0.9;
            strtEndNodes.forEach(n => {
                n.fy = currH / 2
                if (n.id === 54321) {
                    n.fx = currW - 50
                } else n.fx = 50
            });
            localStorage.setItem('width', currW)
            localStorage.setItem('height', currH)
            setWidth(currW)
            setHeight(currH)
            setNodes([...strtEndNodes]);
        }
        setDialogOpen(false)
    };

    const handleUndo = () => {
        console.log(nodes)
        if (history.length === 0) return;
        const lastAction = history[history.length - 1];
        setRedoHistory(prev => [...prev, lastAction]); // Add the last action to redo history
    
        switch (lastAction.action) {
            case 'addNode':
            setNodes(nodes.filter(n => n.id !== lastAction.payload.id)); // Remove the node from the updated nodes array
            console.log(nodes)
        
            break;
            case 'addLink':
                // Check if there are links to undo
                if (links.length >= 0) {
                    // Get the last link from the array
                    const lastLink = links[links.length - 1];

                    // Remove the last link from the `links` array
                    const updatedLinks = links.slice(0,-1);

                    // Update the links state
                    setLinks(updatedLinks);
                    setNodes(nodes)

                    // Push the undone action to `redoHistory` for redo functionality
                    setRedoHistory(prev => [...prev, { action: 'addLink', payload: lastLink }]);

                } else {
                    console.warn("No links to remove in undo addLink.");
                }
                break;
            case 'removeNode':
                setNodes([...nodes, lastAction.payload.node]);
    
                break;
            case 'removeLink':
                setLinks([...links, lastAction.payload]);
         
                break;
            case 'reverseLink':
                    // Undo the reversal by swapping the link back to its original state
                    const { originalLink, newLink } = lastAction.payload;

                    // Replace the reversed link (newLink) with the original link (originalLink)
                    const updatedLinks = links.map(link => 
                        link.source.id === newLink.source.id  && link.target.id === newLink.target.id ? originalLink : link
                    );
        
                    setLinks(updatedLinks); // Update links with the original link restored

                break;
            case 'changeShape':
                // Undo the shape change for a single node
                const nodeToRevert = nodes.find(n => n.id === lastAction.payload?.nodeId);
                if (nodeToRevert) {
                    // Save the redo information before reverting the change
                    setRedoHistory(prev => [
                        ...prev,
                        {
                            action: 'changeShape',
                            payload: {
                                nodeId: nodeToRevert.id,
                                newShape: nodeToRevert.shape, // Save current shape before undo
                                newColor: nodeToRevert.color, // Save current color before undo
                            },
                        },
                    ]);
                
                    // Restore the original shape and color
                    const updatedNode = {
                        ...nodeToRevert,
                        shape: lastAction.payload.originalShape,
                        color: lastAction.payload.originalColor,
                    };
                
                    // Update the nodes array with the reverted node
                    setNodes(nodes.map(n => (n.id === updatedNode.id ? updatedNode : n)));
                  
                }
                break;
            case 'changeMultipleShapes':
                console.log(lastAction.payload)
            if (lastAction.payload.originalShapes) {
                // Collect the current shapes and colors of the affected nodes for redo
                const redoPayload = nodes
                    .filter(n => lastAction.payload.originalShapes.some(o => o.id === n.id))
                    .map(n => ({
                        id: n.id,
                        shape: n.shape,
                        color: n.color,
                    }));

                        // Undo the shape change for multiple nodes
                        for (const originalNode of lastAction.payload.originalShapes) {
                            const node = nodes.find(n => n.id === originalNode.id);
                            if (node) {
                                // Restore each node's original shape and color
                                node.shape = originalNode.shape;
                                node.color = originalNode.color;
                            }
                        }
                        setNodes([...nodes]); // Update nodes to trigger re-render
                        setSelectedNodes([]);
                    
                        // Add the redo action to redoHistory
                        setRedoHistory(prevRedoHistory => [
                            ...prevRedoHistory,
                            {
                                action: 'changeMultipleShapes',
                                payload: {
                                    originalShapes: redoPayload, // Save current shapes and colors for redo
                                },
                            },
                        ]);
                    }
                     break;
                    
            case 'changeSize':
                        // Undo the size change for a single node
                        const nodeToRevert2 = nodes.find(n => n.id === lastAction.payload?.nodeId);
                        if (nodeToRevert2) {
                            // Restore the original size
                            nodeToRevert2.size = lastAction.payload.originalSize;
                            setNodes([...nodes]); // Trigger re-render to update node size
                        }
                    break;

            case 'changeMultipleSizes':
                        // Undo the size change for multiple nodes
                        const updatedNodes = nodes.map(node => {
                            // Find the corresponding original size in the payload
                            const originalNode = lastAction.payload.originalSizes.find(n => n.id === node.id);
                            if (originalNode) {
                                // Restore the original size if found
                                return { ...node, size: originalNode.size };
                            }
                            return node; // Return unchanged node if not part of the action
                        });
                    
                        // Save the current sizes to redoHistory for potential redo
                        const currentSizes = nodes.map(node => ({
                            id: node.id,
                            size: node.size,
                        }));
                    
                        setRedoHistory(prev => [
                            ...prev,
                            {
                                action: 'changeMultipleSizes',
                                payload: { originalSizes: currentSizes },
                            },
                        ]);
                    
                        // Update the nodes state
                        setNodes(updatedNodes);
                        break;


            case 'changeLinkType':
                        // Undo the link type change by reverting to the original type
                        const linkToRevert = links.find(l => l.id === lastAction.payload.linkId);
                        if (linkToRevert) {
                            // Remove the new type association
                            switch (linkToRevert.type) {
                                case 'Assesses':
                                    nodes.find(n => n.id === linkToRevert.source.id).assesses = null;
                                    break;
                                case 'Comes After':
                                    nodes.find(n => n.id === linkToRevert.source.id).comesAfter = null;
                                    break;
                                case 'Is Part Of':
                                    nodes.find(n => n.id === linkToRevert.source.id).isPartOf = null;
                                    break;
                            }
            
                            // Restore the original type association
                            switch (lastAction.payload.originalType) {
                              
                                case 'Assesses':
                                    nodes.find(n => n.id === linkToRevert.source.id).assesses = linkToRevert.target.id;
                                    break;
                                case 'Comes After':
                                    nodes.find(n => n.id === linkToRevert.source.id).comesAfter = linkToRevert.target.id;
                                    break;
                                case 'Is Part Of':
                                    nodes.find(n => n.id === linkToRevert.source.id).isPartOf = linkToRevert.target.id;
                                    break;
                            }
            
                            // Restore the original type to the link
                            linkToRevert.type = lastAction.payload.originalType;
            
                            // Update the nodes state to trigger a re-render
                            setNodes([...nodes]);
                            updateSavedNodes(); // Optionally update the saved state
                        }
                    break;
            
                
        
            default:
                break;
        }
       
        setHistory(prev => prev.slice(0, -1));
    };

    const handleRedo = () => {
        if (redoHistory.length === 0) return;
        const lastUndoneAction = redoHistory[redoHistory.length - 1];
        switch (lastUndoneAction.action) {
            
            case 'addNode':
               console.log(lastUndoneAction.payload.id)
               originalIdRef.current = lastUndoneAction.payload.id;
               originalComesAfterRef.current = lastUndoneAction.payload.comesAfter;
               originalIsPartOfRef.current = lastUndoneAction.payload.isPartOf;

                 const nodeToAdd = {
                     ...lastUndoneAction.payload,
                      comesAfter: null,
                      isPartOf: null,
                 };
                setNodes([...nodes, nodeToAdd]);
                setHistory([...history, lastUndoneAction]);
                break;
            case 'addLink':
            const originalId = originalIdRef.current;
            
                setNodes(nodes => {
  // Find the index of the node with the matching ID
  const nodeIndex = nodes.findIndex(node => node.id === originalId);
  console.log(originalId)
console.log(nodeIndex)
  // If the node is found, modify it in place
  if (nodeIndex !== -1) {
    // Directly modify the comesAfter and isPartOf properties of the node at the found index
    nodes[nodeIndex] = {
      ...nodes[nodeIndex], // Keep all other properties of the node
      comesAfter: originalComesAfterRef.current, // Restore the original comesAfter value
      isPartOf: originalIsPartOfRef.current     // Restore the original isPartOf value
    };
  }

  // Return the updated nodes array (React will detect this as a change due to reference change)
  return [...nodes];  // We create a new array reference so React re-renders
});
console.log(nodes)
                 setLinks([...links, lastUndoneAction.payload]);

                setRedoHistory(prev => prev.slice(0, -1));
                setHistory([...history, lastUndoneAction]);
                break;
            case 'removeNode':
                setNodes(nodes.filter(n => n.id !== lastUndoneAction.payload.node.id));
                setLinks(links.filter(l => 
                    l.source.id !== lastUndoneAction.payload.node.id &&
                    l.target.id !== lastUndoneAction.payload.node.id
                ));
                setHistory([...history, lastUndoneAction]);
                break;
            case 'removeLink':
                setLinks(links.filter(l => 
                    l.source.id !== lastUndoneAction.payload.source.id ||
                    l.target.id !== lastUndoneAction.payload.target.id
                ));
                setHistory([...history, lastUndoneAction]);
                break;
            case 'reverseLink':
                const { originalLink, newLink } = lastUndoneAction.payload;
                const reversedLinks = links.map(link => 
                    link.source.id === originalLink.source.id && 
                    link.target.id === originalLink.target.id ? newLink : link
                );
                setLinks(reversedLinks);
                setHistory([...history, lastUndoneAction]);
                break;
            case 'changeShape':
                    // Handle changeShape redo
                    const nodeToRedo = nodes.find(n => n.id === lastUndoneAction.payload?.nodeId);
                    if (nodeToRedo) {
                        // Apply redo changes
                        nodeToRedo.shape = lastUndoneAction.payload.newShape;
                        nodeToRedo.color = lastUndoneAction.payload.newColor;
                
                        // Update the nodes array by replacing the updated node
                        const updatedNodes = nodes.map(n => 
                            n.id === nodeToRedo.id ? nodeToRedo : n
                        );
                       
                
                        setNodes(updatedNodes); // Trigger re-render with updated nodes
                        setRedoHistory(redoHistory.slice(1));
                        setHistory([...history, lastUndoneAction]);
                    }
                  
                    break;
                    case 'changeMultipleShapes':
                            console.log(lastUndoneAction.payload);
                        
                            if (lastUndoneAction.payload.originalShapes) {
                                // Create a copy of the nodes array to modify
                                const updatedNodes = nodes.map(n => ({ ...n })); 
                        
                                // Collect the current shapes and colors of the affected nodes for undo
                                const undoPayload = updatedNodes
                                    .filter(n => lastUndoneAction.payload.originalShapes.some(o => o.id === n.id))
                                    .map(n => ({
                                        id: n.id,
                                        shape: n.shape,
                                        color: n.color,
                                    }));

                                setHistory(prevUndoHistory => [
                                    ...prevUndoHistory,
                                    {
                                        action: 'changeMultipleShapes',
                                        payload: {
                                            originalShapes: undoPayload, // Save current shapes and colors for undo
                                        },
                                    },
                                ]);
                        
                                // Apply the redo changes to the updatedNodes array
                                for (const updatedNode of lastUndoneAction.payload.originalShapes) {
                                    const node = updatedNodes.find(n => n.id === updatedNode.id);
                                    if (node) {
                                        node.shape = updatedNode.shape;
                                        node.color = updatedNode.color;
                                    }
                                }
                        
                                // Update nodes with the modified array
                                setNodes(updatedNodes);
                        

                            }
                            break;
                        
            case 'changeSize':
                const nodeToResize = nodes.find(n => n.id === lastUndoneAction.payload.nodeId);
                if (nodeToResize) {
                    nodeToResize.size = lastUndoneAction.payload.originalSize;
                    setNodes([...nodes]);
                }
                setHistory([...history, lastUndoneAction]);
                break;
            case 'changeMultipleSizes':
                    // Redo the size change for multiple nodes
                    const updatedNodes = nodes.map(node => {
                        // Find the size to be restored in the redo action
                        const newSizeNode = lastUndoneAction.payload.originalSizes.find(n => n.id === node.id);
                        if (newSizeNode) {
                            // Apply the new size from redo history
                            return { ...node, size: newSizeNode.size };
                        }
                        return node; // Return unchanged node if not part of the redo action
                    });
                
                    // Save the current sizes to the undo history for future undo
                    const sizesBeforeRedo = nodes.map(node => ({
                        id: node.id,
                        size: node.size,
                    }));
                
                    setHistory(prev => [
                        ...prev,
                        {
                            action: 'changeMultipleSizes',
                            payload: { originalSizes: sizesBeforeRedo },
                        },
                    ]);
                
                    // Remove the last redo action from redo history
                    setRedoHistory(prev => prev.slice(0, -1));
                
                    // Update the nodes state to apply the redone sizes
                    setNodes(updatedNodes);
                    setHistory([...history, lastUndoneAction]);
                    break;
            // case 'changeLinkType':
            //     const linkToRedo = links.find(l => l.id === lastUndoneAction.payload.linkId);
            //     if (linkToRedo) {
            //         // Reverse the previous undo (apply the original type back)
            //         switch (lastUndoneAction.payload.originalType) {
            //             case 'Assesses':
            //                 nodes.find(n => n.id === lastUndoneAction.payload.sourceNodeId).assesses = linkToRedo.target.id;
            //                 break;
            //             case 'Comes After':
            //                 nodes.find(n => n.id === lastUndoneAction.payload.sourceNodeId).comesAfter = linkToRedo.target.id;
            //                 break;
            //             case 'Is Part Of':
            //                 nodes.find(n => n.id === lastUndoneAction.payload.sourceNodeId).isPartOf = linkToRedo.target.id;
            //                 break;
            //         }
        
            //         // Apply the new type to the link
            //         linkToRedo.type = lastUndoneAction.payload.originalType;
        
            //         // Update the nodes state to trigger a re-render
            //         setNodes([...nodes]);
            //         updateSavedNodes(); // Optionally update the saved state
        
            //         // Remove the redo action after it's applied
            //         setRedoHistory(prevRedoHistory => prevRedoHistory.slice(0, -1));
            //     }
            // break;
            default:
                break;
        }
    
        // Move the action from redoHistory back to history
        setRedoHistory(prev => prev.slice(0, -1));
    
    };

    const handleRemoveNode = () => {
        let nodeId = null;
        if (selectedNode) {
            nodeId = selectedNode.id;
            setNodes(nodes.filter(n => n.id !== nodeId));
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
        updateSavedNodes();

        // Capture all links connected to the node being removed
        const removedLinks = links.filter(
            l => l.source.id === nodeId || l.target.id === nodeId
        );

        saveToHistory('removeNode', { node: selectedNode, links: removedLinks });
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
                    updateSavedNodes();
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

    const handleAgree = () => {
        setDialogOpen2(false); // Close the dialog

        // Create a temporary input and click it to open file chooser
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = '.csv';
        tempInput.onchange = handleFileUpload;  // Attach the handler
        tempInput.click();  // Open the file chooser
    };


    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    setHistory([]);
                    setRedoHistory([]);
                    // Set the filter type to 3
                    setFilterType(3);
                    handleFilterNodes(3);
                    const text = e.target.result;
                    setFilterType('3');
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
        event.target.value = ''; // Clear the file input after processing
        prevShownNodesNumRef.current = 0;
    };

    const parseCSV = (data) => {
        let savedW = width
        let savedH = height
        let parsedData = d3.csvParse(data, ({ identifier, title, description, url, type, isPartOf, isFormatOf, assesses, comesAfter, fx, fy }) => {
            if (!identifier && !title && fx && fy) {
                savedW = fx
                savedH = fy
                return { name: 'start' }
            }
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
                fx: fx ? +fx : null,
                fy: fy ? +fy : null,
                fixed: (fx || fy) ? true : false,
                shape: type in { 'Atomic ER': 1, 'aER': 1, 'iER': 1, 'rER': 1 } ? type : 'Atomic ER',
            }
            return node
        })

        //   Remove nodes with title "start" or "end" (case insensitive)
        parsedData = parsedData.filter(node => {
            const title = node.name ? node.name.toLowerCase() : '';
            return title !== 'start' && title !== 'end';
        });


        const iERNodes = parsedData.filter(node => node.shape === 'iER');
        let cnt = 0;
        let tmpID = -5
        let lastFx = 0
        parsedData.forEach((node, index) => {
            if (node.shape === 'iER' && !(node.fx || node.fy)) {
                cnt++;
                tmpID = node.id;
                node.fixed = true;
                node.fy = height / 2;
                node.fx = (cnt * (width / iERNodes.length)) - (width * 0.2);
                lastFx = node.fx;
            }
            else if (node.shape === 'aER' && !(node.fx || node.fy)) {
                node.fy = node.comesAfter ? (height) / 2 : null;
            }
        });
        // filter 'iER' nodes then get the average fx position between each consecutive iER node pairs
        const aERNodes = parsedData.filter(node => node.shape === 'aER');
        const avgFXs = []
        const iERsStartEnd = [...iERNodes, nodes.find(n => n.id === 54321)]
        for (let i = 0; i < iERsStartEnd.length - 1; i++) {
            const iER1 = iERsStartEnd[i];
            const iER2 = iERsStartEnd[i + 1];
            avgFXs.push((iER1.fx + iER2.fx) / 2);
        }
        for (let i = 0; i < aERNodes.length; i++) {
            aERNodes[i].fx = !aERNodes[i].fx ? avgFXs[i] : aERNodes[i].fx;
        }

        let maxIdNode = iERNodes.reduce((maxNode, node) => node.id > maxNode.id ? node : maxNode, iERNodes[0]);
        let minIdNode = iERNodes.reduce((minNode, node) => node.id < minNode.id ? node : minNode, iERNodes[0]);
        const tmpNodes = nodes.filter(n => (n.id === 54321) || (n.id === 0)).forEach(node => { // add only start and end
            if (node.id === 54321) {
                const updEnd = {
                    ...node,
                    fy: savedH / 2,
                    fx: savedW - 50,
                    comesAfter: maxIdNode.id
                }
                parsedData.push(updEnd);
            }
            else if (node.id === 0) {
                node.fy = savedH / 2;
                parsedData.find(n => n.id === minIdNode.id).comesAfter = 0;
                parsedData.push(node)
            };
            return node

        })
        // const savedNewWRatio = width / savedW
        // const savedNewHRatio = height / savedH
        if (savedW !== width || savedH !== height) {
            localStorage.setItem('width', savedW)
            localStorage.setItem('height', savedH)
            setWidth(savedW)
            setHeight(savedH)
        }
        setNodes(parsedData);
        // setLinks(newLinks);
    };

    const processLinks = (parsedData) => {
        const newLinks = [];
        parsedData.forEach(node => {
            if (typeof node.isPartOf == 'number') {
                const targetNode = parsedData.find(n => n.id === node.isPartOf);
                if (targetNode) {
                    newLinks.push({ source: node.id, target: targetNode.id, type: 'Is Part Of', hidden: node.hidden || targetNode.hidden });
                }
            }
            if (typeof node.assesses == 'number') {
                const targetNode = parsedData.find(n => n.id === node.assesses);
                if (targetNode) {
                    newLinks.push({ source: node.id, target: targetNode.id, type: 'Assesses', hidden: node.hidden || targetNode.hidden });
                }
            }
            if (typeof node.comesAfter == 'number') {
                const targetNode = parsedData.find(n => n.id === node.comesAfter);
                if (targetNode) {
                    newLinks.push({ source: node.id, target: targetNode.id, type: 'Comes After', hidden: node.hidden || targetNode.hidden });
                }
            }
        });
        return newLinks;
    };
    
    const handleCollapse = () => {
        console.log(selectedNode)
    
        const id = selectedNode.id
    
        const updatedNodes = nodes.map((node) => {
            // Toggle the 'hidden' property based on current collapse state
            console.log(node.isPartOf)
            if (node.isPartOf === id) {
                return { ...node, hidden: !isCollapsed }; // Toggle visibility
            }
            return node;
        });
    
        // Update the nodes state
        setNodes([...updatedNodes]);
    
        // Toggle the collapse state
        setIsCollapsed((prevState) => !prevState);
    
      };
    
    

    const handleAddLink = () => {
        setLinkingNode(selectedNode);
        setAnchorElNode(false);
        setLinkingMessage('Click another node to establish a link');

        // Define the new link object
        const newLink = { source: linkingNode, target: selectedNode };
        saveToHistory('addLink', { link: newLink });
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
            saveToHistory('removeLink', selectedLink); // Save the removed link
            // ?setLinks(links.filter(l => l !== selectedLink));
            setSelectedLink(null);
            setNodes([...nodes]);
            updateSavedNodes();

        } else {
            setLinkingMessage('Select a link to delete');
            setTimeout(() => setLinkingMessage(''), 2000); // Clear the message after 2 seconds
        }

    };

    const handleReverseLink = (source, target) => {
        if (selectedLink) {

            // Create a new array without the selected link
            const updatedLinks = links.filter(
                link => !(
                    link.source.id === selectedLink.source.id &&
                    link.target.id === selectedLink.target.id
                )
            );


            // Create a new link object with swapped source and target

            const newLink = {

                ...selectedLink,

                source: target,

                target: source,

            };

            // Save the original link before reversal to the history
            saveToHistory('reverseLink', {
                originalLink: selectedLink, // Original link before reversal
                newLink: newLink            // Reversed link
            });



            // Add the new link to the updated array
            updatedLinks.push(newLink);

            // Update the state with the new links array
            setLinks(updatedLinks);
            setAnchorElLink(false);
            setSelectedLink(null);
        }
    };


    // Function to save nodes to Local Storage
    const saveNodesToLocalStorage = (nodes, fType) => {
        // an if statement for whether an fType is passed in or not
        if (fType == null) {
            ['1', '2', '3', '4'].forEach(fT => {
                localStorage.setItem(`nodes${fT}`, JSON.stringify(nodes));
            })
        } else {
            localStorage.setItem(`nodes${fType}`, JSON.stringify(nodes));
        }
    };

    // Function to load nodes from Local Storage
    const loadNodesFromLocalStorage = (fType) => {
        const savedNodes = localStorage.getItem(`nodes${fType}`);
        if (savedNodes) {
            return JSON.parse(savedNodes);
        }
        return null; // Return null if no nodes are saved
    };

    const updateSavedNodes = () => {
        ['1', '2', '3', '4'].forEach(fT => {
            const saved = loadNodesFromLocalStorage(fT);
            if (saved) {
                const newNodes = nodes.filter(n => !saved.find(s => s.id === n.id));
                const removedNodes = saved.filter(s => !nodes.find(n => n.id === s.id));
                removedNodes.forEach(n => {
                    saved.splice(saved.indexOf(n), 1);
                });
                // update the other saved nodes only if the 'comesAfter' 'isPartOf' or 'assesses' properties are affected (Do not change coordinates)
                saved.forEach(sNode => {
                    const n = nodes.find(n => n.id === sNode.id);
                    if (n) {
                        sNode.name = n.name;
                        sNode.shape = n.shape;
                        sNode.type = n.type;
                        sNode.size = n.size;
                        sNode.assesses = n.assesses;
                        sNode.isPartOf = n.isPartOf;
                        if (n.comesAfter !== sNode.comesAfter && sNode.shape !== 'aER' && sNode.shape !== 'iER' && sNode.shape !== 'diamond') {
                            sNode.comesAfter = n.comesAfter;
                        } else if (sNode.shape === 'diamond' && n.comesAfter !== sNode.comesAfter) {
                            sNode.comesAfter = n.comesAfter;
                        }
                    }
                });
                saveNodesToLocalStorage([...saved, ...newNodes], fT);
            } else if (fT === '3') {
                saveNodesToLocalStorage(nodes, fT);
            }

        });
    }

    const handleFilterNodes = (fType) => {
        // Save the updated nodes to Local Storage
        var saved = loadNodesFromLocalStorage(fType) ?? loadNodesFromLocalStorage('3') ?? []
        saved = (saved.length > 2 || nodes.length === saved.length) ? saved : nodes

        // Reset nodes to avoid issues when switching views
        // let resetNodes = saved.map(node => ({
        //     ...node,
        //     hidden: false,      // Ensure nodes are visible initially
        //     comesAfter: (node.shape === 'aER' || node.shape === 'rER') ? null : node.comesAfter,   // Reset comesAfter only for aER and rER

        // }));

        let updatedNodes = [];
        switch (fType) {
            case "1":
                // Iterate backwards through the nodes array
                // Find all aER nodes in saved array and set the comesAfter property
                const aERNodes = saved.filter(n => n.shape === 'aER' || n.type === 'end').sort((a, b) => a.id - b.id);
                let prevAER = null;
                aERNodes.forEach((n, i) => {
                    let savedN = saved.find(s => n.id === s.id)
                    if (prevAER) {
                        savedN.comesAfter = prevAER.id;
                    }
                    else {
                        n.comesAfter = 0;
                    }
                    prevAER = n;
                    n.fx = (n.type === 'end') ? n.fx : ((i + 1) * (width / (aERNodes.length - 1))) - (width * 0.2);

                });

                updatedNodes = saved.map(node => {
                    let hidden = false;
                    if (node.id === 0 || node.id === 54321) {
                        hidden = false; // Always show nodes with id 1 and 2
                    }
                    else {
                        hidden = !(node.shape === 'aER' || node.shape === 'rER');
                    }
                    node.fy = (node.shape === 'aER' || node.shape === 'diamond') ? height / 2 : node.y;


                    return { ...node, hidden };
                });


                break;
            case "2":

                updatedNodes = saved.map(node => {
                    let hidden = node.shape === 'Atomic ER';
                    if (node.id === 54321) {
                        node.comesAfter = saved.filter(n => n.shape === 'iER').sort((a, b) => a.id - b.id).slice(-1)[0]?.id; //ensure last comesAfter shows
                    }
                    node.fy = ((node.shape === 'aER' && node.comesAfter != null && saved.find(s => s.comesAfter === node.id)) || node.shape === 'iER' || node.shape === 'diamond') ? height / 2 : node.y;
                    return { ...node, hidden };
                });
                break;
            case "3":
                updatedNodes = saved.map(node => {


                    return { ...node, hidden: false };
                });
                break;
            case "4":
                updatedNodes = saved.map(node => {
                    // ( custom logic to update nodes in case "4")

                    return { ...node, hidden: false };
                });
                break;
            default:
                updatedNodes = saved.map(node => ({ ...node, hidden: false }));
                break;
        }


        // Update the nodes state with the modified nodes
        saveNodesToLocalStorage(updatedNodes, fType);
        setNodes(updatedNodes);
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
        let csvContent = "identifier,title,description,url,type,isPartOf,assesses,comesAfter,fx,fy\n";
        nodes.forEach(node => {
            if (node.alternativeTitle == undefined) {
                node.alternativeTitle = ""
            }
            if (node.targetURL == undefined) {
                node.targetURL = ""
            }
            csvContent += `${node.id},"${node.name}","${node.alternativeTitle}","${node.targetURL}",${node.type},${node.isPartOf || ""},${node.assesses || ""},${node.comesAfter || ""},${node.fx},${node.fy}\n`;
        });
        csvContent += `,,,,,,,,${width},${height}\n`;

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


    function difference(object, base) { // MIT License https://gist.github.com/Yimiprod/7ee176597fef230d1451
        function changes(object, base) {
            return _.transform(object, function (result, value, key) {
                if (!_.isEqual(value, base[key])) {
                    result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
                }
            });
        }
        return changes(object, base);
    }

    const Transition = React.forwardRef(function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    });

    function handleExportClick() {
        exportSvg(svgRef.current, 'my-d3-graph.svg');
    };

    return (
        <div>
            <div className='navbar'>
                <Navbar onExportClick={handleExportClick} onDownloadCSV={downloadCSV} />
                <Stack m={'0 auto'} spacing={2} direction='row' >
                <Button variant="contained" component="span" onClick={() => setDialogOpen2(true)}>Upload CSV</Button>
                    <Button onClick={() => setDialogOpen(true)} color={'error'} startIcon={<CgTrashEmpty />} variant="contained">Clear</Button>
                    <Button onClick={handleAddNode} startIcon={<Add />} variant="outlined">Add ER</Button>
                    <Button id='recenterButton' variant="outlined">Recenter</Button>
                    <Button onClick={nodes.length > 2 ? handleAutoLayout : null} color={'success'} variant="contained">Auto Layout</Button>
                    <Button onClick={handleUndo} startIcon={<UndoIcon />} variant="outlined" disabled={history.length === 0} >Undo</Button>
                    <Button onClick={handleRedo} startIcon={<RedoIcon />} variant="outlined" disabled={redoHistory.length === 0} >Redo</Button>
                    <FormControl variant="outlined">
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
                </Stack>
                {/* <Button onClick={handleRemoveNode} startIcon={<Remove />} variant="outlined">Remove Node</Button> */}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FormControlLabel sx={{ marginLeft: '2px' }}
                        control={<Switch size="small" checked={labelsToggled} onChange={() => setLabelsToggled(!labelsToggled)} />}
                        label={`${labelsToggled ? 'Hide' : 'Show'} Labels`}
                    />
                    <FormControlLabel sx={{ marginLeft: '2px' }}
                        control={<Switch size="small" checked={legendToggled} onChange={() => setLegendToggled(!legendToggled)} />}
                        label={`Legend ${!legendToggled ? '(Hidden)' : '(Showing)'} `}
                    />
  </div>
            </div>
            <LinearProgress ref={progressRef} color="secondary" style={{ visibility: 'hidden', marginTop: '3px' }} />

            {/* upload csv dialog */}
            <Dialog open={dialogOpen2} onClose={() => setDialogOpen2(false)}>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Do you confirm clearing all your Educational Resources' data for this session?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen2(false)} color="primary">
                        Dismiss
                    </Button>
                    <Button onClick={handleAgree} color="primary" autoFocus>
                        Agree
                    </Button>
                </DialogActions>
            </Dialog>

            {/* clear dialog */}
            {dialogOpen && <Dialog
                open={dialogOpen}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setDialogOpen(false)}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{"Clear and reset all data?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        Do you confirm clearing all your Educational Resources' data for this session?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button color={'error'} onClick={() => handleClear(false)}>Dismiss</Button>
                    <Button onClick={() => handleClear(true)}>Agree</Button>
                </DialogActions>
            </Dialog>}
            <svg ref={svgRef} preserveAspectRatio='xMidYMid meet' viewBox={`0 0 ${width} ${height - 100}`}>
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
                    handleCollapse={handleCollapse}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
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
                    handleReverseLink={handleReverseLink}
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
