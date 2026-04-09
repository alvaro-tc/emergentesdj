import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import axios from 'axios';
import configData from '../../../../config';
import { SET_ACTIVE_SUBJECT } from '../../../../store/actions';

const SubjectSection = () => {
    const dispatch = useDispatch();
    const account = useSelector((state) => state.account);
    const activeSubject = useSelector((state) => state.account.activeSubject);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        if (account.token) {
            axios.defaults.headers.common['Authorization'] = `Token ${account.token}`;
            axios.get(configData.API_SERVER + 'subjects')
                .then(response => {
                    const fetchedSubjects = response.data;
                    setSubjects(fetchedSubjects);
                    if (!activeSubject && fetchedSubjects.length > 0) {
                        dispatch({ type: SET_ACTIVE_SUBJECT, payload: fetchedSubjects[0] });
                    }
                })
                .catch(error => console.error('Error fetching subjects', error));
        }
    }, [account.token, activeSubject, dispatch]);

    const handleChange = (event) => {
        const selectedSubjectId = event.target.value;
        const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
        dispatch({ type: SET_ACTIVE_SUBJECT, payload: selectedSubject });
    };

    if (!account.isLoggedIn) return null;

    return (
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 200 }} size="small">
                <Select
                    value={activeSubject ? activeSubject.id : ''}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="" disabled>Select Subject</MenuItem>
                    {subjects.map(subject => (
                        <MenuItem key={subject.id} value={subject.id}>
                            {subject.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {activeSubject && (
                <Typography variant="body1" sx={{ ml: 2, fontWeight: 'bold' }}>
                    {activeSubject.name}
                </Typography>
            )}
            {activeSubject && (
                <Typography variant="caption" sx={{ ml: 1 }}>
                    | {activeSubject.period_details ? activeSubject.period_details.name : 'No Period'} | {activeSubject.program_details ? activeSubject.program_details.name : 'No Program'}
                </Typography>
            )}
        </Box>
    );
};

export default SubjectSection;
