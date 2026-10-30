import React, { useState, useEffect } from 'react';
import { Utensils, Clock, Sparkles, Filter, CheckCircle2, PlusCircle, BookOpen, X } from 'lucide-react';
import { api } from '../api/client';
import { Recipe, User } from '../types';

interface RecipeViewProps {
  onAddToShoppingList: (ingredient: string) => void;
  user?: User | null;
  onOpenAuth?: () => void;
}

export const RecipeView: React.FC<RecipeViewProps> = ({ onAddToShoppingList, user, onOpenAuth }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [maxCookingTime, setMaxCookingTime] = useState<number | ''>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecipes();
    } else {
      setLoading(false);
    }
  }, [user, selectedCuisine, maxCookingTime]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      let url = '/recipes?based_on=inventory';
      if (selectedCuisine !== 'All') url += `&cuisine=${selectedCuisine}`;
      if (maxCookingTime) url += `&max_time=${maxCookingTime}`;

      const res = await api.get<Recipe[]>(url);
      setRecipes(res.data);
    } catch (err) {
      console.error('Failed to fetch recipe recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  const cuisines = ['All', 'Italian', 'American', 'Continental', 'Asian', 'Mexican', 'Breakfast'];

  if (!user) {
    return (
      <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Utensils className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Personalized Recipe Recommendations</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Our smart matching engine compares your stocked refrigerator inventory against recipes to calculate exact match percentages and missing ingredients.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer"
        >
          Sign In / Quick Demo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="glass-panel p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Smart Matching Engine
          </span>
          <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-400" />
            Recipe Recommendations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Recipes ranked dynamically by overlap with your current fridge inventory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Max Time:</span>
            <select
              value={maxCookingTime}
              onChange={(e) => setMaxCookingTime(e.target.value ? Number(e.target.value) : '')}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              <option value="" className="bg-slate-900">Any</option>
              <option value="15" className="bg-slate-900">≤ 15 mins</option>
              <option value="30" className="bg-slate-900">≤ 30 mins</option>
              <option value="45" className="bg-slate-900">≤ 45 mins</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCuisine(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCuisine === c
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Analyzing fridge inventory & calculating match scores...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Matching Recipes</h4>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or adding more items to your fridge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>

                <div className="mb-3">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Fridge Ingredient Match
                    </span>
                    <span className="font-bold text-emerald-400">{r.match_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${r.match_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {r.cuisine}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                      {r.name}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    {r.cooking_time}m
                  </span>
                </div>

                {r.dietary_tags && r.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-2">
                    {r.dietary_tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="my-3 pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                    Missing Ingredients ({r.missing_ingredients.length}):
                  </span>
                  {r.missing_ingredients.length === 0 ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> You have all ingredients in stock!
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {r.missing_ingredients.map((ing) => (
                        <button
                          key={ing}
                          onClick={() => onAddToShoppingList(ing)}
                          className="text-[11px] bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1 transition-all"
                          title="Add to shopping list"
                        >
                          <PlusCircle className="w-3 h-3 text-rose-400" />
                          {ing}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedRecipe(r)}
                className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition-all"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                View Cooking Instructions
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700/60 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {selectedRecipe.cuisine} • {selectedRecipe.cooking_time} mins
            </span>
            <h3 className="text-xl font-bold text-white mt-2 mb-4">
              {selectedRecipe.name}
            </h3>

            <div className="mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Required Ingredients:</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>{ing.name}</span>
                    <span className="font-semibold text-emerald-400">{ing.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Preparation & Cooking Steps:</h4>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedRecipe.instructions}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
