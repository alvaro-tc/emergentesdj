import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import TotalIncomeCard from './../../../ui-component/cards/Skeleton/TotalIncomeCard';

// assets
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';

//-----------------------|| DASHBOARD - TOTAL INCOME LIGHT CARD ||-----------------------//

const TotalIncomeLightCard = ({ isLoading, title, count, icon }) => {
    const theme = useTheme();

    return (
        <React.Fragment>
            {isLoading ? (
                <TotalIncomeCard />
            ) : (
                <MainCard
                    sx={{
                        overflow: 'hidden',
                        position: 'relative',
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            width: '210px',
                            height: '210px',
                            background: `linear-gradient(210.04deg, ${theme.palette.warning.dark} -50.94%, rgba(144, 202, 249, 0) 83.49%)`,
                            borderRadius: '50%',
                            top: '-30px',
                            right: '-180px',
                        },
                        '&:before': {
                            content: '""',
                            position: 'absolute',
                            width: '210px',
                            height: '210px',
                            background: `linear-gradient(140.9deg, ${theme.palette.warning.dark} -14.02%, rgba(144, 202, 249, 0) 70.50%)`,
                            borderRadius: '50%',
                            top: '-160px',
                            right: '-130px',
                        },
                    }}
                    contentSX={{ p: '16px !important' }}
                >
                    <List sx={{ py: 0 }}>
                        <ListItem alignItems="center" disableGutters sx={{ py: 0 }}>
                            <ListItemAvatar>
                                <Avatar
                                    variant="rounded"
                                    sx={{
                                        ...theme.typography.commonAvatar,
                                        ...theme.typography.largeAvatar,
                                        bgcolor: theme.palette.warning.light,
                                        color: theme.palette.warning.dark,
                                    }}
                                >
                                    {icon || <StorefrontTwoToneIcon fontSize="inherit" />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                sx={{ mt: 0.45, mb: 0.45, py: 0 }}
                                primary={<Typography variant="h4">{count}</Typography>}
                                secondary={
                                    <Typography variant="subtitle2" sx={{ color: theme.palette.grey[500], mt: '5px' }}>
                                        {title}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    </List>
                </MainCard>
            )}
        </React.Fragment>
    );
};

TotalIncomeLightCard.propTypes = {
    isLoading: PropTypes.bool,
    title: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.element
};

export default TotalIncomeLightCard;
