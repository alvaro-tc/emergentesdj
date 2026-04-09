import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { Grid } from '@mui/material';

// project imports
import EarningCard from './EarningCard';
import PopularCard from './PopularCard';
import TotalOrderLineChartCard from './TotalOrderLineChartCard';
import TotalIncomeDarkCard from './TotalIncomeDarkCard';
import TotalIncomeLightCard from './TotalIncomeLightCard';
import TotalGrowthBarChart from './TotalGrowthBarChart';
import StudentDashboard from '../Student'; // Import Student Dashboard
import TeacherDashboard from '../Teacher/index'; // Import Teacher Dashboard explicitly
import { gridSpacing } from './../../../store/constant';
import configData from '../../../config';
import axios from 'axios';

// assets
import PeopleAltTwoToneIcon from '@mui/icons-material/PeopleAltTwoTone';
import SchoolTwoToneIcon from '@mui/icons-material/SchoolTwoTone';
import ClassTwoToneIcon from '@mui/icons-material/ClassTwoTone';
import LibraryBooksTwoToneIcon from '@mui/icons-material/LibraryBooksTwoTone';
import DescriptionTwoToneIcon from '@mui/icons-material/DescriptionTwoTone';
import AssignmentTurnedInTwoToneIcon from '@mui/icons-material/AssignmentTurnedInTwoTone';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import AssessmentTwoToneIcon from '@mui/icons-material/AssessmentTwoTone';


//-----------------------|| DEFAULT DASHBOARD ||-----------------------//

const Dashboard = () => {
    const [isLoading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const account = useSelector((state) => state.account);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = account.token;

                if (!token) {
                    console.error("No token found in state");
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${configData.API_SERVER}reports/dashboard_stats/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setStats(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setLoading(false);
            }
        };

        if (account.isInitialized) {
            fetchStats();
        }
    }, [account]);

    // Render Student Dashboard
    if (account.user && account.user.role === 'STUDENT') {
        return <StudentDashboard />;
    }

    // Render Teacher Dashboard
    if (account.user && account.user.role === 'TEACHER') {
        return <TeacherDashboard />;
    }

    const getIcon = (role, index) => {
        if (role === 'ADMIN') {
            switch (index) {
                case 1: return <SchoolTwoToneIcon fontSize="inherit" />;
                case 2: return <PeopleAltTwoToneIcon fontSize="inherit" />;
                case 3: return <ClassTwoToneIcon fontSize="inherit" />;
                case 4: return <LibraryBooksTwoToneIcon fontSize="inherit" />;
                default: return <DescriptionTwoToneIcon fontSize="inherit" />;
            }
        } else if (role === 'TEACHER') {
            switch (index) {
                case 1: return <ClassTwoToneIcon fontSize="inherit" />;
                case 2: return <PeopleAltTwoToneIcon fontSize="inherit" />;
                case 3: return <AssignmentTurnedInTwoToneIcon fontSize="inherit" />;
                case 4: return <AccountTreeTwoToneIcon fontSize="inherit" />;
                default: return <DescriptionTwoToneIcon fontSize="inherit" />;
            }
        }
        return <DescriptionTwoToneIcon fontSize="inherit" />;
    };

    return (
        <Grid container spacing={gridSpacing}>
            <Grid size={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid
                        size={{
                            lg: 4,
                            md: 6,
                            sm: 6,
                            xs: 12
                        }}>
                        <EarningCard
                            isLoading={isLoading}
                            title={stats.card1?.title}
                            count={stats.card1?.count}
                            icon={getIcon(stats.role, 1)}
                        />
                    </Grid>
                    <Grid
                        size={{
                            lg: 4,
                            md: 6,
                            sm: 6,
                            xs: 12
                        }}>
                        <TotalOrderLineChartCard
                            isLoading={isLoading}
                            title={stats.card2?.title}
                            count={stats.card2?.count}
                            icon={getIcon(stats.role, 2)}
                        />
                    </Grid>
                    <Grid
                        size={{
                            lg: 4,
                            md: 12,
                            sm: 12,
                            xs: 12
                        }}>
                        <Grid container spacing={gridSpacing}>
                            <Grid
                                size={{
                                    sm: 6,
                                    xs: 12,
                                    md: 6,
                                    lg: 12
                                }}>
                                <TotalIncomeDarkCard
                                    isLoading={isLoading}
                                    title={stats.card3?.title}
                                    count={stats.card3?.count}
                                    icon={getIcon(stats.role, 3)}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    sm: 6,
                                    xs: 12,
                                    md: 6,
                                    lg: 12
                                }}>
                                <TotalIncomeLightCard
                                    isLoading={isLoading}
                                    title={stats.card4?.title}
                                    count={stats.card4?.count}
                                    icon={getIcon(stats.role, 4)}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid size={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid
                        size={{
                            xs: 12,
                            md: 8
                        }}>
                        <TotalGrowthBarChart
                            isLoading={isLoading}
                            growthData={stats.chart_data}
                            title={stats.chart_title}
                        />
                    </Grid>
                    <Grid
                        size={{
                            xs: 12,
                            md: 4
                        }}>
                        <PopularCard
                            isLoading={isLoading}
                            popularCourses={stats.popular_data}
                            title={stats.popular_title}
                            viewAllLink={stats.role === 'ADMIN' ? '/school/courses' : '#'}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
