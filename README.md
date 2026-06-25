# Ant Simulator

Ant simulator is an experimental project built with React, Koota (ECS framework for state management), and three.js.

## Overview

Ants spawn in their colony then spread out to look for food. They leave pheromone trails to guide other ants back to the colony (blue) or to a food source (orange/red).

By default, ants will move away from their colony, randomly turning slightly to scan for pheromone trails or food. If food is found, the ant will pick it up, turn around, then begin leaving pheromones to guide other ants to the source. The ant will follow the strongest pheromone trails that lead home.

## How it works

Each ant has 3 sensors in a slight arc in front of the ant: one directly in front, one slightly offset to the left, and another slightly offset to the right. Each sensor detects pheromones, determines the overall value of turning, then "steers" the ant in the direction with the highest value.

### Example Scenario

An ant is looking for food and each sensor picks up some pheromones.

The front sensor picks up some pheromones that lead to food, the right sensor picks up many pheromones that lead to food, and the left sensor picks up pheromones that lead home.

The left sensor has no value, since the ant is not trying to return home. The front sensor has some value, but the right sensor has the greatest value. Therefore, the ant will move forward and turn slightly to the right.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Running Locally

Start the development server

```bash
npm start
```

Navigate to [http://localhost:5173/](http://localhost:5173/)

## Resources

### Koota

source: [repo](https://github.com/pmndrs/koota)

examples: [starter template](https://github.com/Ctrlmonster/r3f-koota-starter)
