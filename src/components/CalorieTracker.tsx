import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Droplets, Utensils, Target, AlertTriangle, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  water: number; // in glasses
}

interface DailyData {
  foods: FoodEntry[];
  waterGlasses: number;
  date: string;
}

const CalorieTracker = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    carbs: 250,
    protein: 150,
    water: 8
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
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [tempGoals, setTempGoals] = useState<DailyGoals>({
    calories: 2000,
    carbs: 250,
    protein: 150,
    water: 8
  });

  useEffect(() => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
      setDailyGoals(JSON.parse(savedGoals));
      setTempGoals(JSON.parse(savedGoals));
    } else {
      setIsFirstTime(true);
      setShowGoalsDialog(true);
    }
  }, []);

  useEffect(() => {
    const dateKey = selectedDate.toDateString();
    const savedData = localStorage.getItem(`calorieData_${dateKey}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setDailyData({
        ...parsed,
        foods: parsed.foods.map((food: any) => ({
          ...food,
          timestamp: new Date(food.timestamp)
        }))
      });
    } else {
      setDailyData({
        foods: [],
        waterGlasses: 0,
        date: dateKey
      });
    }
  }, [selectedDate]);

  useEffect(() => {
    if (dailyData.foods.length > 0 || dailyData.waterGlasses > 0) {
      localStorage.setItem(`calorieData_${dailyData.date}`, JSON.stringify(dailyData));
    }
  }, [dailyData]);

  const saveGoals = () => {
    setDailyGoals(tempGoals);
    localStorage.setItem('userGoals', JSON.stringify(tempGoals));
    setShowGoalsDialog(false);
    setIsFirstTime(false);
    
    toast({
      title: "Goals Updated!",
      description: "Your daily nutrition goals have been saved."
    });
  };

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

  // Calculate totals
  const totals = dailyData.foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      carbs: acc.carbs + food.carbs,
      protein: acc.protein + food.protein
    }),
    { calories: 0, carbs: 0, protein: 0 }
  );

  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyData.date !== today) return; 
    
    if (totals.calories > dailyGoals.calories) {
      toast({
        title: "Calorie Alert!",
        description: `You've exceeded your daily calorie goal by ${totals.calories - dailyGoals.calories} calories.`,
        variant: "destructive"
      });
    }
  }, [totals, dailyGoals, dailyData.date]);

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'bg-destructive';
    if (percentage > 80) return 'bg-warning';
    return 'bg-primary';
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateTitle = isToday ? "Today's Progress" : format(selectedDate, "MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-[image:var(--gradient-bg)] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Calendar and Settings */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-foreground">Calorie Tracker</h1>
            <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Goals
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {isFirstTime ? "Set Your Daily Goals" : "Update Daily Goals"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="calories" className="text-right">
                      Calories
                    </Label>
                    <Input
                      id="calories"
                      type="number"
                      className="col-span-3"
                      value={tempGoals.calories}
                      onChange={(e) => setTempGoals(prev => ({ ...prev, calories: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="carbs" className="text-right">
                      Carbs (g)
                    </Label>
                    <Input
                      id="carbs"
                      type="number"
                      className="col-span-3"
                      value={tempGoals.carbs}
                      onChange={(e) => setTempGoals(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="protein" className="text-right">
                      Protein (g)
                    </Label>
                    <Input
                      id="protein"
                      type="number"
                      className="col-span-3"
                      value={tempGoals.protein}
                      onChange={(e) => setTempGoals(prev => ({ ...prev, protein: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="water" className="text-right">
                      Water (glasses)
                    </Label>
                    <Input
                      id="water"
                      type="number"
                      className="col-span-3"
                      value={tempGoals.water}
                      onChange={(e) => setTempGoals(prev => ({ ...prev, water: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button onClick={saveGoals} className="w-full">
                  {isFirstTime ? "Set Goals" : "Update Goals"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground">Track your daily nutrition and stay healthy</p>
          
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTitle}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Daily Progress Overview */}
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

        {/* Add Food Form */}
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
              <CardTitle>{isToday ? "Today's" : format(selectedDate, "MMMM d")} Food Log</CardTitle>
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
