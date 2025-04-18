import { Box, Typography, Paper, List, ListItem, ListItemText, LinearProgress } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import type { Project } from '../types';

const Projects = () => {
  const { projects, problems } = useAppContext();

  const getProjectProgress = (project: Project) => {
    const problem = problems.find(p => p.id === project.problemId);
    if (!problem) return 0;
    
    // Calculate progress based on completion status and attempts
    if (problem.completed) return 100;
    // TODO: Add more sophisticated progress calculation based on attempts
    return 50;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Projects
      </Typography>

      <Paper sx={{ p: 2 }}>
        <List>
          {projects.map((project) => {
            const problem = problems.find(p => p.id === project.problemId);
            const progress = getProjectProgress(project);

            return (
              <ListItem key={project.id}>
                <ListItemText
                  primary={problem?.name || 'Unknown Problem'}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Status: {project.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Started: {new Date(project.startDate).toLocaleDateString()}
                      </Typography>
                      {project.endDate && (
                        <Typography variant="body2" color="text.secondary">
                          Completed: {new Date(project.endDate).toLocaleDateString()}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress variant="determinate" value={progress} />
                      </Box>
                    </>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};

export default Projects; 