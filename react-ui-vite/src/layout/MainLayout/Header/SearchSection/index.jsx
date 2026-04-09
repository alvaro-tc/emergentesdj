import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Avatar, Box, ButtonBase, Card, CardContent,
    InputAdornment, OutlinedInput, Popper,
    List, ListItem, ListItemButton, ListItemText,
    Paper, ClickAwayListener,
    Menu, MenuItem, FormControlLabel, Checkbox,
    Select, InputLabel, FormControl
} from '@mui/material';
import PopupState, { bindPopper } from 'material-ui-popup-state';
import Transitions from '../../../../ui-component/extended/Transitions';
import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons-react';
import axios from 'axios';
import configData from '../../../../config';
import { SET_ACTIVE_COURSE } from '../../../../store/actions';

// Shared avatar sx styles
const avatarSx = (theme) => ({
    ...theme.typography.commonAvatar,
    ...theme.typography.mediumAvatar,
    bgcolor: 'secondary.light',
    color: 'secondary.dark',
    '&:hover': {
        bgcolor: 'secondary.dark',
        color: 'secondary.light',
    },
});

const closeAvatarSx = (theme) => ({
    ...theme.typography.commonAvatar,
    ...theme.typography.mediumAvatar,
    bgcolor: 'orange.light',
    color: 'orange.dark',
    '&:hover': {
        bgcolor: 'orange.dark',
        color: 'orange.light',
    },
});

const SearchSection = () => {
    const [value, setValue] = useState('');
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [open, setOpen] = useState(false);

    // Desktop input ref for Popper anchor
    const anchorRef = useRef(null);

    const dispatch = useDispatch();
    const account = useSelector((state) => state.account);
    const activeCourse = useSelector((state) => state.account.activeCourse);

    const fetchCourses = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'courses')
                .then(response => {
                    setCourses(response.data);
                    if (response.data.length > 0 && !activeCourse) {
                        let selected = null;
                        if (account.user && account.user.active_course) {
                            selected = response.data.find(c => c.id === account.user.active_course);
                        }
                        if (!selected) {
                            selected = response.data.find(c => !c.subject_details?.archived) || response.data[0];
                        }
                        if (selected) {
                            dispatch({ type: SET_ACTIVE_COURSE, payload: selected });
                        }
                    }
                })
                .catch(error => console.error('Error fetching courses', error));
        }
    };

    const loadCourseList = () => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'courses')
                .then(response => setCourses(response.data))
                .catch(error => console.error('Error fetching courses', error));
        }
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
        if (!open) loadCourseList();
    };

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account.token, account.user]);

    const [showArchived, setShowArchived] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('All');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [anchorEl, setAnchorEl] = useState(null);

    const handleSettingsClick = (event) => setAnchorEl(event.currentTarget);
    const handleSettingsClose = () => setAnchorEl(null);
    const handleToggleArchived = () => setShowArchived(!showArchived);

    const periods = ['All', ...new Set(courses.map(c => c.subject_details?.period_details?.name || 'Unknown'))];
    const programs = ['All', ...new Set(courses.map(c => c.subject_details?.program_details?.name || 'Unknown'))];

    const filteredCoursesList = courses.filter(course => {
        const subjectName = course.subject_details?.name || '';
        const courseParallel = course.parallel || '';
        const lowerValue = value.toLowerCase();
        const matchesSearch = subjectName.toLowerCase().includes(lowerValue) || courseParallel.toLowerCase().includes(lowerValue);
        const coursePeriod = course.subject_details?.period_details?.name || 'Unknown';
        const matchesPeriod = selectedPeriod === 'All' || coursePeriod === selectedPeriod;
        const courseProgram = course.subject_details?.program_details?.name || 'Unknown';
        const matchesProgram = selectedProgram === 'All' || courseProgram === selectedProgram;
        const isPeriodSelected = selectedPeriod !== 'All';
        const isArchived = course.subject_details?.archived;
        const matchesArchived = showArchived || !isArchived || isPeriodSelected;
        return matchesSearch && matchesArchived && matchesPeriod && matchesProgram;
    });

    useEffect(() => {
        setFilteredCourses(filteredCoursesList);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, courses, showArchived, selectedPeriod, selectedProgram]);

    const handleSelect = (course) => {
        setOpen(false);
        setValue('');
        dispatch({ type: SET_ACTIVE_COURSE, payload: course });
        if (account.token) {
            axios.patch(configData.API_SERVER + 'manage-users/profile/', { active_course: course.id })
                .catch(error => console.error('Error saving active course preference', error));
        }
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) return;
        setOpen(false);
    };

    return (
        <React.Fragment>
            {/* ── MOBILE VIEW ─────────────────────────────────── */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <PopupState variant="popper" popupId="search-popup-mobile">
                    {(popupState) => (
                        <React.Fragment>
                            <Box sx={{ ml: 2 }}>
                                <ButtonBase
                                    sx={{ borderRadius: '12px' }}
                                    onClick={(e) => {
                                        loadCourseList();
                                        popupState.open(e);
                                    }}
                                >
                                    <Avatar variant="rounded" sx={avatarSx}>
                                        <IconSearch stroke={1.5} size="1.2rem" />
                                    </Avatar>
                                </ButtonBase>
                            </Box>

                            <Popper
                                {...bindPopper(popupState)}
                                transition
                                sx={{
                                    zIndex: 1100,
                                    width: '99%',
                                    top: '-55px !important',
                                    px: { xs: '10px', sm: '12px' },
                                }}
                            >
                                {({ TransitionProps }) => (
                                    <Transitions type="zoom" {...TransitionProps} sx={{ transformOrigin: 'center left' }}>
                                        <ClickAwayListener onClickAway={popupState.close}>
                                            <Card
                                                sx={{
                                                    bgcolor: '#fff',
                                                    border: { xs: 0 },
                                                    boxShadow: { xs: 'none' },
                                                }}
                                            >
                                                <CardContent sx={{ p: '12px !important' }}>
                                                    {/* Search input */}
                                                    <OutlinedInput
                                                        fullWidth
                                                        id="input-search-header-mobile"
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
                                                        onFocus={() => loadCourseList()}
                                                        placeholder="Buscar Paralelo"
                                                        sx={{
                                                            width: '100%',
                                                            ml: '4px',
                                                            '& input': {
                                                                background: 'transparent !important',
                                                                pl: '5px !important',
                                                            },
                                                        }}
                                                        startAdornment={
                                                            <InputAdornment position="start">
                                                                <IconSearch
                                                                    stroke={1.5}
                                                                    size="1rem"
                                                                    style={{ color: '#9e9e9e', fontSize: '1rem' }}
                                                                />
                                                            </InputAdornment>
                                                        }
                                                        endAdornment={
                                                            <InputAdornment position="end">
                                                                <Box sx={{ ml: 2 }}>
                                                                    <ButtonBase sx={{ borderRadius: '12px' }}>
                                                                        <Avatar
                                                                            variant="rounded"
                                                                            sx={closeAvatarSx}
                                                                            onMouseDown={(e) => e.preventDefault()}
                                                                            onClick={() => {
                                                                                setValue('');
                                                                                popupState.close();
                                                                            }}
                                                                        >
                                                                            <IconX stroke={1.5} size="1.3rem" />
                                                                        </Avatar>
                                                                    </ButtonBase>
                                                                </Box>
                                                            </InputAdornment>
                                                        }
                                                        inputProps={{ 'aria-label': 'Buscar paralelo', autoComplete: 'off' }}
                                                    />

                                                    {/* Results list */}
                                                    <List sx={{ maxHeight: 300, overflow: 'auto', mt: 1, p: 0 }}>
                                                        {filteredCourses.length === 0 && (
                                                            <ListItem sx={{ py: 1, px: 1.5 }}>
                                                                <ListItemText
                                                                    primary="Sin resultados"
                                                                    primaryTypographyProps={{ variant: 'caption', color: 'textSecondary' }}
                                                                />
                                                            </ListItem>
                                                        )}
                                                        {value === '' && filteredCourses.length > 0 && (
                                                            <ListItem sx={{ bgcolor: '#f5f5f5', py: 0.5, px: 1.5 }}>
                                                                <ListItemText
                                                                    primary="Sugerencias"
                                                                    primaryTypographyProps={{ variant: 'caption', color: 'textSecondary' }}
                                                                />
                                                            </ListItem>
                                                        )}
                                                        {filteredCourses.map((course) => (
                                                            <ListItemButton
                                                                key={course.id}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    handleSelect(course);
                                                                    popupState.close();
                                                                }}
                                                                sx={{ borderRadius: '8px' }}
                                                            >
                                                                <ListItemText
                                                                    primary={`${course.subject_details?.name} - ${course.parallel}`}
                                                                    secondary={[
                                                                        course.subject_details?.period_details?.name,
                                                                        course.subject_details?.program_details?.name,
                                                                    ].filter(Boolean).join(' - ')}
                                                                />
                                                            </ListItemButton>
                                                        ))}
                                                    </List>
                                                </CardContent>
                                            </Card>
                                        </ClickAwayListener>
                                    </Transitions>
                                )}
                            </Popper>
                        </React.Fragment>
                    )}
                </PopupState>
            </Box>

            {/* ── DESKTOP VIEW ─────────────────────────────────── */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <OutlinedInput
                    sx={{
                        width: { lg: '434px', md: '250px' },
                        ml: 2,
                        pr: 2,
                        pl: 2,
                        '& input': {
                            background: 'transparent !important',
                            pl: '5px !important',
                        },
                    }}
                    id="input-search-header"
                    value={value}
                    onClick={handleToggle}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setOpen(true);
                    }}
                    placeholder="Buscar Paralelo"
                    startAdornment={
                        <InputAdornment position="start">
                            <IconSearch stroke={1.5} size="1rem" style={{ color: '#9e9e9e' }} />
                        </InputAdornment>
                    }
                    endAdornment={
                        <InputAdornment position="end">
                            <ButtonBase sx={{ borderRadius: '12px' }} onClick={handleSettingsClick}>
                                <Avatar variant="rounded" sx={avatarSx}>
                                    <IconAdjustmentsHorizontal stroke={1.5} size="1.3rem" />
                                </Avatar>
                            </ButtonBase>
                            <Menu
                                id="search-settings-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={handleSettingsClose}
                            >
                                <MenuItem>
                                    <FormControl fullWidth>
                                        <InputLabel id="period-select-label">Periodo</InputLabel>
                                        <Select
                                            labelId="period-select-label"
                                            id="period-select"
                                            value={selectedPeriod}
                                            label="Periodo"
                                            onChange={(e) => setSelectedPeriod(e.target.value)}
                                        >
                                            {periods.map((period) => (
                                                <MenuItem key={period} value={period}>{period}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </MenuItem>
                                <MenuItem>
                                    <FormControl fullWidth>
                                        <InputLabel id="program-select-label">Carrera</InputLabel>
                                        <Select
                                            labelId="program-select-label"
                                            id="program-select"
                                            value={selectedProgram}
                                            label="Carrera"
                                            onChange={(e) => setSelectedProgram(e.target.value)}
                                        >
                                            {programs.map((program) => (
                                                <MenuItem key={program} value={program}>{program}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </MenuItem>
                                <MenuItem onClick={handleToggleArchived}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={showArchived}
                                                onChange={handleToggleArchived}
                                                name="showArchived"
                                                color="primary"
                                            />
                                        }
                                        label="Mostrar Archivados"
                                    />
                                </MenuItem>
                            </Menu>
                        </InputAdornment>
                    }
                    inputProps={{ 'aria-label': 'search', autoComplete: 'off' }}
                    ref={anchorRef}
                />
                <Popper
                    open={open && filteredCourses.length > 0}
                    anchorEl={anchorRef.current}
                    role={undefined}
                    transition
                    disablePortal
                    style={{ zIndex: 1200, width: '434px' }}
                    placement="bottom-start"
                >
                    {({ TransitionProps }) => (
                        <Transitions type="fade" {...TransitionProps}>
                            <Paper sx={{ maxHeight: 250, overflow: 'auto', mt: 1 }}>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <List>
                                        {value === '' && (
                                            <ListItem sx={{ bgcolor: '#f5f5f5' }}>
                                                <ListItemText
                                                    primary="Sugerencias"
                                                    primaryTypographyProps={{ variant: 'caption', color: 'textSecondary' }}
                                                />
                                            </ListItem>
                                        )}
                                        {filteredCourses.map((course) => (
                                            <ListItemButton key={course.id} onClick={() => handleSelect(course)}>
                                                <ListItemText
                                                    primary={`${course.subject_details?.name} - ${course.parallel}`}
                                                    secondary={[
                                                        course.subject_details?.period_details?.name,
                                                        course.subject_details?.program_details?.name,
                                                    ].filter(Boolean).join(' - ')}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </ClickAwayListener>
                            </Paper>
                        </Transitions>
                    )}
                </Popper>
            </Box>
        </React.Fragment>
    );
};

export default SearchSection;
