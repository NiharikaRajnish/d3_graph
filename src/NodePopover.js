import React, { useState } from 'react';
import { Button, Popover, TextField } from '@mui/material';
import { Link as LinkIcon, Remove } from '@mui/icons-material';

const NodePopover = ({ id, open, anchorEl, onClose, handleCollapse, isCollapsed, setIsCollapsed, handleAddLink, selectedNode, selectedNodes , handleShapeChange, handleSizeChange, handleRenameNode, handleRemoveNode }) => {
    const [newName, setNewName] = useState(selectedNode?.name || '');
    

    const handleChangeName = (event) => {
        setNewName(event.target.value);
    };


  // Handle Enter key to rename the node
  const handleRenameOnEnter = (event) => {
    if (event.key === 'Enter') {
      handleRenameNode(newName);  // Rename the node
      onClose();  // Close the popover
    }
  };




    const handleRemoveClick = () => {
        handleRemoveNode(newName); // remove selectedNode
        onClose();
    };

    const handleShapeOptionChange = (event) => {
        const newShape = event.target.value;
        handleShapeChange(newShape);
    };

    const handleSizeOptionChange = (event) => {
        const newSize = +event.target.value;
        console.log(newSize)
        handleSizeChange(newSize);
    };

if(selectedNode != ""){
    return (
        <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            sx={{
                    width: 'auto',
                    height: 'auto',
                    padding: '10px',
                    marginTop:'10px',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    gap: 1,
                    '@media (max-width: 600px)': {
          flexDirection: 'column',  // Switch to column layout on small screens
          alignItems: 'flex-start',
        },
                
            }}
        >

<Button
                onClick={handleCollapse}
                variant="outlined"
                margin="dense"
                size="small"
                sx={{
                    margin:1,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    height:'30px',
  
                    maxWidth: '100%',  // Ensure it doesn’t overflow container
                    '@media (max-width: 600px)': {
                      width: '100%',  // Full-width on smaller screens
                    },
                  }}
            >
                {isCollapsed ? 'Uncollapse' : 'Collapse'} {/* Toggle button text */}
            </Button>
            <Button
                onClick={handleAddLink}
                startIcon={<LinkIcon />}
                variant="outlined"
                margin="dense"
                size="small"
                sx={{
                    margin:1,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    height:'30px',
  
                    maxWidth: '100%',  // Ensure it doesn’t overflow container
                    '@media (max-width: 600px)': {
                      width: '100%',  // Full-width on smaller screens
                    },
                  }}
            >
                Add Link
            </Button>

            <TextField
                select
                label="Type"
                value={selectedNode?.shape || 'circle'}
                onChange={handleShapeOptionChange}
                SelectProps={{
                    native: true,
                }}
                margin="dense"
                size="small"

                style={{ marginLeft: '4px', marginRight: '4px', width: '130px' }}
            >
                <option value="Atomic ER">Atomic ER</option>
                <option value="aER">aER</option>
                <option value="iER">iER</option>
                <option value="rER">rER</option>
            </TextField>
            <TextField
                label="Size"
                type="number"
                value={selectedNode?.size || ''}
                onChange={handleSizeOptionChange}
                margin="dense"
                size="small"
                style={{ marginLeft: '4px', marginRight: '4px', width: '55px' }}
            />
<TextField
    label="Rename ER"
    value={newName}
    onChange={handleChangeName}
    onKeyDown={handleRenameOnEnter}
    margin="dense"
    size="small"
    style={{ marginLeft: '4px', width: '150px' }}
/>
            <Button
                // startIcon={<Remove/>}
                onClick={handleRemoveClick}
                variant="outlined"
                color="primary"
                size="small"
                style={{ marginLeft: '4px', width: '20px' }}
                sx={{
                    margin:2,
                    minWidth: 90,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '100%',  // Ensure it doesn’t overflow container
                    '@media (max-width: 600px)': {
                      width: '100%',  // Full-width on smaller screens
                    },
                  }}
            >
                Remove
            </Button>
        </Popover>
    );
}
else if(selectedNodes.length >1){
     return (
    <Popover
    id={id}
    open={open}
    onClose={onClose}
    anchorReference="anchorPosition"
    anchorPosition={{ top: window.innerHeight - 100, left: window.innerWidth / 2 +50}}
    anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
    }}
    transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
    }}
    PaperProps={{
        style: {
            width: 'auto',
            marginLeft: "5px",
            marginRight: "5px",
            height: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
        },
    }}
        >
            <TextField
                select
                label="Type"
                value={selectedNodes[selectedNodes.length-1]?.shape || 'circle'}
                onChange={handleShapeOptionChange}
                SelectProps={{
                    native: true,
                }}
                margin="dense"
                size="small"

                style={{ marginLeft: '4px', marginRight: '4px', width: '130px' }}
            >
                <option value="Atomic ER">Atomic ER</option>
                <option value="aER">aER</option>
                <option value="iER">iER</option>
                <option value="rER">rER</option>
            </TextField>
            <TextField
                label="Size"
                type="number"
                value={selectedNodes[selectedNodes.length-1].size || ''}
                onChange={handleSizeOptionChange}
                margin="dense"
                size="small"
                style={{ marginLeft: '4px', marginRight: '4px', width: '70px' }}
            />
            <Button
                // startIcon={<Remove/>}
                onClick={handleRemoveClick}
                variant="outlined"
                color="primary"
                size="small"
                sx={{
                    minWidth: 90,
                    p: 1,  // Adds padding inside the button
                    m: 0.5,  // Adds margin around the button
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    '@media (max-width: 600px)': {
                      width: '100%',  // Full-width on smaller screens
                    },
                  }}
            >
                Remove
            </Button>

        </Popover>
     );
}
};


export default NodePopover;
