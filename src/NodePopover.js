import React, { useState } from 'react';
import { Button, Popover, TextField } from '@mui/material';
import { Link as LinkIcon, Remove } from '@mui/icons-material';

const NodePopover = ({ id, open, anchorEl, onClose, handleAddLink, selectedNode, handleShapeChange, handleSizeChange, handleRenameNode, handleRemoveNode }) => {
    const [newName, setNewName] = useState(selectedNode?.name || '');
    

    const handleChangeName = (event) => {
        setNewName(event.target.value);
    };

    const handleRenameClick = () => {
        handleRenameNode(newName); // Update selectedNode's name
        onClose();
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
        handleSizeChange(newSize);
    };

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
            PaperProps={{
                style: {
                    width: 'auto',
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
            <Button
                onClick={handleAddLink}
                startIcon={<LinkIcon />}
                variant="outlined"
                margin="dense"
                size="small"
                style={{ marginRight: '4px' }}
            >
                Add Link
            </Button>
            <TextField
                select
                label="Shape"
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
                label="Rename Node"
                value={selectedNode.name}
                onChange={handleChangeName}
                margin="dense"
                size="small"
                style={{ marginLeft: '4px', width: '150px' }}
            />
            <Button
                onClick={handleRenameClick}
                variant="outlined"
                color="primary"
                size="small"
                style={{ marginLeft: '4px', width: '20px' }}
            >
                Rename
            </Button>
            <Button
                // startIcon={<Remove/>}
                onClick={handleRemoveClick}
                variant="outlined"
                color="primary"
                size="small"
                style={{ marginLeft: '4px', width: '20px' }}
            >
                Remove
            </Button>
        </Popover>
    );
};

export default NodePopover;
