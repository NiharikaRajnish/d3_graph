import React from 'react';
import { Popover, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { Remove } from '@mui/icons-material';

const LinkPopover = ({ id, open, anchorEl, onClose, handleTypeChange, handleRemoveLink, selectedLink, sourceNodeType }) => {
    const handleChange = (event) => {
        const newType = event.target.value;
        handleTypeChange(newType);
    };

    const getDefaultType = () => {
        console.log(sourceNodeType)
        if (sourceNodeType === 'Atomic ER') {
            return 'Is Part Of';
        }
        return 'Comes After'; // Default type
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
        >
            <FormControl style={{ margin: '8px' }}>
                <InputLabel>Type</InputLabel>
                <Select
                   value={selectedLink && selectedLink.type ? selectedLink.type :  getDefaultType()}
                   onChange={handleChange}
                    
                >
                    <MenuItem value="Comes After">Comes After</MenuItem>
                    <MenuItem value="Is Part Of">Is Part Of</MenuItem>
                    <MenuItem value="Assesses">Assesses</MenuItem>
                </Select>
            </FormControl>
            <Button
                onClick={handleRemoveLink}
                startIcon={<Remove />}
                variant="outlined"
                style={{ margin: '8px' }}
            >
                Remove Link
            </Button>
        </Popover>
    );
};

export default LinkPopover;
