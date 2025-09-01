import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Droplets, Utensils, Target, AlertTriangle } from 'lucide-react';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  timestamp: Date;
}

interface DailyGoals {
  calories: number;
  carbs: number;
  protein: number;
  water: number; 
}

interface DailyData {
  foods: FoodEntry[];
  waterGlasses: number;
  date: string;
}

const CalorieTracker = () => {
  const [dailyGoals] = useState<DailyGoals>({
    calories: 2000,
    carbs: 250, // grams
    protein: 150, // grams
    water: 8 // glasses
  });

  const [dailyData, setDailyData] = useState<DailyData>({
    foods: [],
    waterGlasses: 0,
    date: new Date().toDateString()
  });

  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    carbs: '',
    protein: ''
  });

  useEffect(() => {
    const today = new Date().toDateString();
    const savedData = localStorage.getItem(`calorieData_${today}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setDailyData({
        ...parsed,
        foods: parsed.foods.map((food: any) => ({
          ...food,
          timestamp: new Date(food.timestamp)
        }))
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`calorieData_${dailyData.date}`, JSON.stringify(dailyData));
  }, [dailyData]);

  const addFood = () => {
    if (!newFood.name || !newFood.calories) {
      toast({
        title: "Missing Information",
        description: "Please enter food name and calories.",
        variant: "destructive"
      });
      return;
    }

    const food: FoodEntry = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: Number(newFood.calories),
      carbs: Number(newFood.carbs) || 0,
      protein: Number(newFood.protein) || 0,
      timestamp: new Date()
    };

    setDailyData(prev => ({
      ...prev,
      foods: [...prev.foods, food]
    }));

    setNewFood({ name: '', calories: '', carbs: '', protein: '' });
    
    toast({
      title: "Food Added!",
      description: `${food.name} (${food.calories} cal) added to your daily log.`
    });
  };

  const addWater = () => {
    setDailyData(prev => ({
      ...prev,
      waterGlasses: prev.waterGlasses + 1
    }));
    
    toast({
      title: "Water Logged!",
      description: "One glass of water added. Stay hydrated! 💧"
    });
  };

  const removeWater = () => {
    if (dailyData.waterGlasses > 0) {
      setDailyData(prev => ({
        ...prev,
        waterGlasses: prev.waterGlasses - 1
      }));
    }
  };

  const removeFood = (id: string) => {
    setDailyData(prev => ({
      ...prev,
      foods: prev.foods.filter(food => food.id !== id)
    }));
    
    toast({
      title: "Food Removed",
      description: "Item removed from your daily log."
    });
  };

  const totals = dailyData.foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      carbs: acc.carbs + food.carbs,
      protein: acc.protein + food.protein
    }),
    { calories: 0, carbs: 0, protein: 0 }
  );

  useEffect(() => {
    if (totals.calories > dailyGoals.calories) {
      toast({
        title: "Calorie Alert!",
        description: `You've exceeded your daily calorie goal by ${totals.calories - dailyGoals.calories} calories.`,
        variant: "destructive"
      });
    }
    if (totals.carbs > dailyGoals.carbs) {
      toast({
        title: "Carb Alert!",
        description: `You've exceeded your daily carb goal by ${Math.round(totals.carbs - dailyGoals.carbs)}g.`,
        variant: "destructive"
      });
    }
    if (totals.protein > dailyGoals.protein) {
      toast({
        title: "Protein Alert!",
        description: `You've exceeded your daily protein goal by ${Math.round(totals.protein - dailyGoals.protein)}g.`,
        variant: "destructive"
      });
    }
  }, [totals, dailyGoals]);

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'bg-destructive';
    if (percentage > 80) return 'bg-warning';
    return 'bg-primary';
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-bg)] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Calorie Tracker</h1>
          <p className="text-muted-foreground">Track your daily nutrition and stay healthy</p>
        </div>

        {/* OverView */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Calories */}
          <Card className="relative overflow-hidden shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Calories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${totals.calories > dailyGoals.calories ? 'text-destructive' : 'text-foreground'}`}>
                    {totals.calories}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {dailyGoals.calories}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(totals.calories, dailyGoals.calories)}`}
                    style={{ width: `${getProgressPercentage(totals.calories, dailyGoals.calories)}%` }}
                  />
                </div>
                {totals.calories > dailyGoals.calories && (
                  <div className="flex items-center space-x-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">Over limit!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Carbs */}
          <Card className="relative overflow-hidden shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Carbs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${totals.carbs > dailyGoals.carbs ? 'text-destructive' : 'text-foreground'}`}>
                    {Math.round(totals.carbs)}g
                  </span>
                  <span className="text-sm text-muted-foreground">/ {dailyGoals.carbs}g</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(totals.carbs, dailyGoals.carbs)}`}
                    style={{ width: `${getProgressPercentage(totals.carbs, dailyGoals.carbs)}%` }}
                  />
                </div>
                {totals.carbs > dailyGoals.carbs && (
                  <div className="flex items-center space-x-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">Over limit!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Protein */}
          <Card className="relative overflow-hidden shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Protein</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${totals.protein > dailyGoals.protein ? 'text-destructive' : 'text-foreground'}`}>
                    {Math.round(totals.protein)}g
                  </span>
                  <span className="text-sm text-muted-foreground">/ {dailyGoals.protein}g</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(totals.protein, dailyGoals.protein)}`}
                    style={{ width: `${getProgressPercentage(totals.protein, dailyGoals.protein)}%` }}
                  />
                </div>
                {totals.protein > dailyGoals.protein && (
                  <div className="flex items-center space-x-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">Over limit!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Water */}
          <Card className="relative overflow-hidden shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Droplets className="h-5 w-5 text-water" />
                <CardTitle className="text-sm font-medium">Water</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {dailyData.waterGlasses}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {dailyGoals.water} glasses</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500 bg-water"
                    style={{ width: `${getProgressPercentage(dailyData.waterGlasses, dailyGoals.water)}%` }}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={addWater}
                    className="flex-1 bg-water hover:bg-water/90 text-water-foreground"
                  >
                    +1
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={removeWater}
                    className="flex-1"
                    disabled={dailyData.waterGlasses === 0}
                  >
                    -1
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Food  */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Utensils className="h-5 w-5 text-primary" />
              <CardTitle>Add Food</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="foodName">Food Name</Label>
                <Input
                  id="foodName"
                  placeholder="e.g., Chicken Breast"
                  value={newFood.name}
                  onChange={(e) => setNewFood(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="200"
                  value={newFood.calories}
                  onChange={(e) => setNewFood(prev => ({ ...prev, calories: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="5"
                  value={newFood.carbs}
                  onChange={(e) => setNewFood(prev => ({ ...prev, carbs: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  placeholder="25"
                  value={newFood.protein}
                  onChange={(e) => setNewFood(prev => ({ ...prev, protein: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              onClick={addFood} 
              className="w-full bg-[image:var(--gradient-primary)] hover:opacity-90 transition-[var(--transition-smooth)]"
            >
              Add Food
            </Button>
          </CardContent>
        </Card>

        {/* Food Log */}
        {dailyData.foods.length > 0 && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Today's Food Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyData.foods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{food.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {food.calories} cal • {food.carbs}g carbs • {food.protein}g protein
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFood(food.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalorieTracker;
