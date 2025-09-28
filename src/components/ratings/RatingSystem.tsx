"use client"

import { useState, useEffect } from 'react'
import { Star, MessageCircle, ThumbsUp, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { customClasses } from '@/styles/theme'

interface Rating {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  target_id: string
  target_type: 'restaurant' | 'order' | 'driver'
  rating: number
  comment: string
  created_at: string
  helpful_count: number
}

interface RatingSystemProps {
  targetId: string
  targetType: 'restaurant' | 'order' | 'driver'
  targetName: string
  currentUserId?: string
  showAddRating?: boolean
}

export function RatingSystem({ 
  targetId, 
  targetType, 
  targetName, 
  currentUserId,
  showAddRating = true 
}: RatingSystemProps) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  useEffect(() => {
    loadRatings()
  }, [targetId, targetType])

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRatings(data || [])
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, rating) => sum + rating.rating, 0) / data.length
        setAverageRating(Math.round(avg * 10) / 10)
        setTotalRatings(data.length)
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    }
  }

  const submitRating = async () => {
    if (!currentUserId || newRating === 0) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: currentUserId,
          user_name: 'Usuário', // Em produção, pegar do perfil do usuário
          target_id: targetId,
          target_type: targetType,
          rating: newRating,
          comment: newComment,
          helpful_count: 0
        })

      if (error) throw error

      setNewRating(0)
      setNewComment('')
      setShowRatingDialog(false)
      loadRatings()
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const markHelpful = async (ratingId: string) => {
    try {
      const rating = ratings.find(r => r.id === ratingId)
      if (!rating) return

      const { error } = await supabase
        .from('ratings')
        .update({ helpful_count: rating.helpful_count + 1 })
        .eq('id', ratingId)

      if (error) throw error
      loadRatings()
    } catch (error) {
      console.error('Erro ao marcar como útil:', error)
    }
  }

  const StarRating = ({ rating, size = 'sm', interactive = false, onRatingChange }: {
    rating: number
    size?: 'sm' | 'md' | 'lg'
    interactive?: boolean
    onRatingChange?: (rating: number) => void
  }) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]
    ratings.forEach(rating => {
      distribution[rating.rating - 1]++
    })
    return distribution.reverse()
  }

  return (
    <div className="space-y-6">
      {/* Resumo das Avaliações */}
      <Card className={customClasses.cardRegular}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#000000]">Avaliações</h3>
              <p className="text-sm text-[#6c757d]">{totalRatings} avaliações</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#000000]">{averageRating}</div>
              <StarRating rating={averageRating} size="md" />
            </div>
          </div>

          {/* Distribuição das Estrelas */}
          {totalRatings > 0 && (
            <div className="space-y-2">
              {getRatingDistribution().map((count, index) => {
                const stars = 5 - index
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
                return (
                  <div key={stars} className="flex items-center space-x-2 text-sm">
                    <span className="w-8 text-[#000000]">{stars}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-[#6c757d]">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Botão para Adicionar Avaliação */}
          {showAddRating && currentUserId && (
            <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
              <DialogTrigger asChild>
                <Button className={customClasses.btnPrimary + " w-full mt-4"}>
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar {targetName}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Avaliar {targetName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-[#6c757d] mb-3">Como foi sua experiência?</p>
                    <StarRating 
                      rating={newRating} 
                      size="lg" 
                      interactive 
                      onRatingChange={setNewRating}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Conte-nos sobre sua experiência (opcional)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className={customClasses.inputPrimary}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRatingDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className={customClasses.btnPrimary + " flex-1"}
                      onClick={submitRating}
                      disabled={newRating === 0 || isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <Card key={rating.id} className={customClasses.cardRegular}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={rating.user_avatar} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-[#000000]">{rating.user_name}</p>
                      <div className="flex items-center space-x-2">
                        <StarRating rating={rating.rating} size="sm" />
                        <span className="text-xs text-[#6c757d]">
                          {new Date(rating.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <p className="text-[#000000] mb-3">{rating.comment}</p>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#6c757d] hover:text-[#28a745]"
                      onClick={() => markHelpful(rating.id)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Útil ({rating.helpful_count})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#6c757d] hover:text-[#28a745]"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Responder
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ratings.length === 0 && (
        <div className="text-center py-8">
          <Star className="w-16 h-16 mx-auto mb-4 text-[#6c757d]" />
          <p className="text-[#6c757d]">Ainda não há avaliações</p>
          <p className="text-sm text-[#6c757d]">Seja o primeiro a avaliar!</p>
        </div>
      )}
    </div>
  )
}