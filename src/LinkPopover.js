import React from 'react';
import { Popover, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { Remove,SwapHoriz  } from '@mui/icons-material';

const LinkPopover = ({ id, open, anchorEl, onClose, handleTypeChange, handleRemoveLink, handleReverseLink, selectedLink, sourceNodeType }) => {
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

    const handleReverse = () => {
        handleReverseLink(selectedLink.source, selectedLink.target);
    };


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
            <FormControl
                style={{ margin: '8px', width: '180px' }}
                sx={{
                p: 1,  // Adds padding inside the button
                m: 0.5,  // Adds margin around the button
                textOverflow: 'ellipsis',
                maxWidth: '100%',  // Ensure it doesn’t overflow container
                '@media (max-width: 600px)': {
                width: '100%',  // Full-width on smaller screens
                },
                }}
            >
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
                style={{ margin: '8px', width: '110px' }}
                sx={{
                    p: 1,  // Adds padding inside the button
                    m: 0.5,  // Adds margin around the button
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',  // Ensure it doesn’t overflow container
                    '@media (max-width: 600px)': {
                      width: '100%',  // Full-width on smaller screens
                    },
                  }}

            >
                Remove Link
            </Button>
            <Button
                onClick={handleReverse}
                startIcon={<SwapHoriz />}
                variant="outlined"
                style={{ margin: '8px', width: '110px' }}
                sx={{
                    textOverflow: 'ellipsis',
                    p: 1,  // Adds padding inside the button
                    m: 1,  // Adds margin around the button
                    maxWidth: '100%',  // Ensure it doesn’t overflow container
                    '@media (max-width: 600px)': {
                      width: '100%',  // Full-width on smaller screens
                    },
                  }}
            >
                Reverse Link
            </Button>
        </Popover>
    );
};

export default LinkPopover;
