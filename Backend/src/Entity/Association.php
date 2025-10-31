<?php

/**
 * src/Entity/Association.php
 *
 * @license https://opensource.org/license/MIT MIT License
 * @link https://www.etsisi.upm.es/ ETS de Ingeniería de Sistemas Informáticos
 */

namespace TDW\ACiencia\Entity; // hace la labor de libreria

use DateTime;
use Doctrine\Common\Collections\{ ArrayCollection, Collection };
use Doctrine\ORM\Mapping as ORM;
use JetBrains\PhpStorm\ArrayShape;
use ReflectionObject;

#[ORM\Entity, ORM\Table(name: 'associations')]
#[ORM\UniqueConstraint(name: 'Association_name_uindex', columns: ['name'])]
class Association extends Element
{
    /* Set of Entities participating in the Association */
    /**
     * @var Collection<int, Entity>
     */
    #[ORM\ManyToMany(
        targetEntity: Entity::class,
        inversedBy: 'associations'
    )]
    #[ORM\JoinTable(
        name: 'entity_contributes_association',
        joinColumns: [
            new ORM\JoinColumn(name: 'association_id', referencedColumnName: 'id')
        ],
        inverseJoinColumns: [
            new ORM\JoinColumn(name: 'entity_id', referencedColumnName: 'id')
        ]
    )]
    protected Collection $entities;

    #[ORM\Column(type: 'string', length: 255, nullable: false)]
    private string $website;


    /**
     * Association constructor.
     *
     * @param non-empty-string $name
     * @param non-empty-string $website
     * @param DateTime|null $birthDate
     * @param DateTime|null $deathDate
     * @param string|null $imageUrl
     * @param string|null $wikiUrl
     */

    public function __construct(
        string $name,
        string $website,
        ?DateTime $birthDate = null,
        ?DateTime $deathDate = null,
        ?string $imageUrl = null,
        ?string $wikiUrl = null
    ) {
        parent::__construct($name, $birthDate, $deathDate, $imageUrl, $wikiUrl);
        $this->entities = new ArrayCollection();
        $this->website   = $website;
    }

    /**
     * @return string
     */
    public function getWebsite(): string
    {
        return $this->website;
    }

    /**
     * @param non-empty-string $website
     */
    public function setWebsite(string $website): void
    {
        $this->website = $website;
    }

    /**
     * Gets the entities participating in the association.
     *
     * @return Collection<Entity>
     */
    public function getEntities(): Collection
    {
        return $this->entities;
    }

    /**
     * Determines if the association contains the given entity.
     *
     * @param Entity $entity
     * @return bool
     */
    public function containsEntity(Entity $entity): bool
    {
        return $this->entities->contains($entity);
    }

    /**
     * Adds an entity to this association.
     *
     * @param Entity $entity
     * @return void
     */
    public function addEntity(Entity $entity): void
    {
        if ($this->containsEntity($entity)) {
            return;
        }
        $this->entities->add($entity);
        $entity->addAssociation($this);
    }

    /**
     * Removes an entity from this association.
     *
     * @param Entity $entity
     * @return bool TRUE if this collection contained the specified element.
     */
    public function removeEntity(Entity $entity): bool
    {
        $removed = $this->entities->removeElement($entity);
        if ($removed) {
            $entity->removeAssociation($this);
        }
        return $removed;
    }


    /** @see \Stringable */
    public function __toString(): string
    {
        return sprintf(
            '%s website=%s, entities=%s)]',
            parent::__toString(),
            $this->getWebsite(),
            $this->getCodesStr($this->getEntities())
        );
    }

    /**
     * @see \JsonSerializable
     */
    #[ArrayShape(['association' => "array|mixed"])]
    public function jsonSerialize(): mixed
    {
        /* Reflection to examine the instance */
        $reflection = new ReflectionObject($this);
        $data = parent::jsonSerialize();
        $data['website'] = $this->getWebsite();
        $numEntities = count($this->getEntities());
        $data['entities'] = $numEntities !== 0 ? $this->getCodes($this->getEntities()) : null;
        return [strtolower($reflection->getShortName()) => $data];
    }

}