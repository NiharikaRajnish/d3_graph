import React from 'react';
import { Popover, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { Remove } from '@mui/icons-material';

const LinkPopover = ({ id, open, anchorEl, onClose, handleTypeChange, handleRemoveLink, selectedLink, sourceNodeType }) => {
    const handleChange = (event) => {
        const newType = event.target.value;
        handleTypeChange(newType);
    };

    // const getDefaultType = () => {
    //     console.log(sourceNodeType)
    //     if (sourceNodeType === 'Atomic ER') {
    //         return 'Is Part Of';
    //     }
    //     return 'Comes After'; // Default type
    // };

    //rules for linking

    const renderMenuItems = () => {
        if (selectedLink.source.shape === 'diamond' || selectedLink.target.shape === 'diamond') {
            return [
                <MenuItem key="Comes After" value="Comes After">Comes After</MenuItem>
            ];

        }

        // Only allow Atomics to be linked together with Comes After
        if (selectedLink.source.shape === 'Atomic ER' && selectedLink.target.shape === 'Atomic ER') {
            return <MenuItem value="Comes After">Comes After</MenuItem>;
        }

        // an atomic node can only have comes after and is part of
        if (selectedLink.source.shape === 'Atomic ER' || selectedLink.target.shape === 'Atomic ER') {
            return [
                <MenuItem key="Comes After" value="Comes After">Comes After</MenuItem>,
                <MenuItem key="Is Part Of" value="Is Part Of">Is Part Of</MenuItem>,
            ];

        }

        //only rERs should have the assess relation
        if (selectedLink.source.shape === 'rER' || selectedLink.target.shape === 'rER') {
            return [
                <MenuItem key="Comes After" value="Comes After">Comes After</MenuItem>,
                <MenuItem key="Is Part Of" value="Is Part Of">Is Part Of</MenuItem>,
                <MenuItem value="Assesses">Assesses</MenuItem>
            ];

        }

        //
        if (selectedLink.source.shape === 'rER' || selectedLink.target.shape === 'rER') {
            return [
                <MenuItem key="Comes After" value="Comes After">Comes After</MenuItem>,
                <MenuItem key="Is Part Of" value="Is Part Of">Is Part Of</MenuItem>,
                <MenuItem value="Assesses">Assesses</MenuItem>
            ];

        }



        else {

            return [
                <MenuItem key="Comes After" value="Comes After">Comes After</MenuItem>,
                 <MenuItem key="Is Part Of" value="Is Part Of">Is Part Of</MenuItem>,

            ];
        }
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
            <FormControl style={{ margin: '8px', width: '150px' }}>
                <InputLabel>Type</InputLabel>
                <Select
                    value={selectedLink.type}
                    onChange={handleChange}

                >
                    {renderMenuItems()}
                </Select>
            </FormControl>
            <Button
                onClick={handleRemoveLink}
                startIcon={<Remove />}
                variant="outlined"
                style={{ margin: '8px', width: '100px' }}

            >
                Remove Link
            </Button>
        </Popover>
    );
};

export default LinkPopover;
