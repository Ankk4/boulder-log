import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Box,
  Text,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { DeleteIcon, StarIcon, CheckIcon } from '@chakra-ui/icons';
import { useAppContext } from '../context/AppContext';
import type { Problem } from '../types';

const Problems: React.FC = () => {
  const { problems, setProblems } = useAppContext();
  const [sortBy, setSortBy] = useState<'date' | 'difficulty' | 'project'>('date');
  const [newProblem, setNewProblem] = useState({
    name: '',
    frenchGrade: '',
    colorGrade: '',
  });
  const [problemToDelete, setProblemToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleAddProblem = (e: React.FormEvent) => {
    e.preventDefault();
    const problem: Problem = {
      id: Date.now().toString(),
      name: newProblem.name,
      frenchGrade: newProblem.frenchGrade,
      colorGrade: newProblem.colorGrade,
      isProject: false,
      completed: false,
      totalAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    setProblems([...problems, problem]);
    setNewProblem({ name: '', frenchGrade: '', colorGrade: '' });
  };

  const toggleProject = (id: string) => {
    setProblems(
      problems.map((p) =>
        p.id === id ? { ...p, isProject: !p.isProject } : p
      )
    );
  };

  const toggleCompletion = (id: string) => {
    setProblems(
      problems.map((p) =>
        p.id === id ? { ...p, completed: !p.completed } : p
      )
    );
  };

  const handleDelete = (id: string) => {
    setProblemToDelete(id);
    onOpen();
  };

  const confirmDelete = () => {
    if (problemToDelete) {
      setProblems(problems.filter((p) => p.id !== problemToDelete));
      onClose();
      setProblemToDelete(null);
    }
  };

  const sortedProblems = [...problems].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'difficulty':
        return b.frenchGrade.localeCompare(a.frenchGrade);
      case 'project':
        return Number(b.isProject) - Number(a.isProject);
      default:
        return 0;
    }
  });

  return (
    <Box p={4}>
      <Text fontSize="2xl" mb={4}>Problems</Text>
      
      <form onSubmit={handleAddProblem}>
        <VStack spacing={4} mb={8} align="stretch">
          <FormControl>
            <FormLabel htmlFor="name">Problem Name</FormLabel>
            <Input
              id="name"
              value={newProblem.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setNewProblem({ ...newProblem, name: e.target.value })
              }
            />
          </FormControl>
          
          <FormControl>
            <FormLabel htmlFor="frenchGrade">French Grade</FormLabel>
            <Input
              id="frenchGrade"
              value={newProblem.frenchGrade}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setNewProblem({ ...newProblem, frenchGrade: e.target.value })
              }
            />
          </FormControl>
          
          <FormControl>
            <FormLabel htmlFor="colorGrade">Gym Color</FormLabel>
            <Input
              id="colorGrade"
              value={newProblem.colorGrade}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setNewProblem({ ...newProblem, colorGrade: e.target.value })
              }
            />
          </FormControl>
          
          <Button type="submit">Add New Problem</Button>
        </VStack>
      </form>

      <FormControl mb={4}>
        <Select
          data-testid="sort-select"
          value={sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
            setSortBy(e.target.value as 'date' | 'difficulty' | 'project')
          }
        >
          <option value="date">Sort by Date</option>
          <option value="difficulty">Sort by Difficulty</option>
          <option value="project">Sort by Project Status</option>
        </Select>
      </FormControl>

      <VStack spacing={4} align="stretch">
        {sortedProblems.map((problem) => (
          <Box
            key={problem.id}
            p={4}
            borderWidth={1}
            borderRadius="md"
            position="relative"
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">{problem.name}</Text>
                <Text fontSize="sm">
                  Grade: {problem.frenchGrade} | Color: {problem.colorGrade}
                </Text>
              </VStack>
              <HStack>
                <IconButton
                  data-testid={`project-toggle-${problem.id}`}
                  aria-label="Toggle project status"
                  icon={<StarIcon color={problem.isProject ? 'yellow.500' : 'gray.300'} />}
                  onClick={() => toggleProject(problem.id)}
                />
                <IconButton
                  data-testid={`completion-toggle-${problem.id}`}
                  aria-label="Toggle completion status"
                  icon={<CheckIcon color={problem.completed ? 'green.500' : 'gray.300'} />}
                  onClick={() => toggleCompletion(problem.id)}
                />
                <IconButton
                  data-testid={`delete-button-${problem.id}`}
                  aria-label="Delete problem"
                  icon={<DeleteIcon />}
                  onClick={() => handleDelete(problem.id)}
                />
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this problem?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={confirmDelete}>
              Delete
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Problems; 