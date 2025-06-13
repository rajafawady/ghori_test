"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/index';
import { Plus, Search, Building, Users, Briefcase, Crown } from 'lucide-react';

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'starter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Crown className="w-4 h-4" />;
      case 'professional': return <Building className="w-4 h-4" />;
      case 'starter': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Company Management</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 flex items-center space-x-2">
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white rounded-lg shadow-lg border hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">@{company.slug}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionColor(company.subscription_plan)}`}>
                  {getSubscriptionIcon(company.subscription_plan)}
                  {company.subscription_plan}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Max Users:</span>
                  <span className="font-medium">{company.max_users}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Jobs/Month:</span>
                  <span className="font-medium">{company.max_jobs_per_month}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{company.created_at.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    company.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {company.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500">Get started by adding your first company.</p>
          <Button className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        </div>
      )}
    </div>
  );
}