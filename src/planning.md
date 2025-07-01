## Desired Behaviors

- ants should scout for a max range before turning around
- ants should maintain a reference of recent pheromones in order to identify when they are going the wrong way (if the pheromones they follow are further and further from the goal, turn around)
  - this will also help ants identify when a food source is depleted (e.g. 'stepsToGoal' of recent pheromone is 0 but there is no food nearby)
- ants should periodically analyze their surroundings, especially when many pheromones are present
  - make a quick circle and look for the optimal path, adjust accordingly
- ant roles:
  - scouts search for food
  - workers manage the colony, staying close to the colony and ready to act when a scout reports food
    - example worker task: reinforcing "home" pheromone trails
- antennae communication: ants should be able to communicate with other ants when close
  - verify direction of colony, comparing data and paths